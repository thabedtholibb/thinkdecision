from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import numpy as np
import json
from app.database import get_db
from app.models.case import Case, AggregationMethod
from app.models.criteria import Criteria
from app.models.alternative import Alternative
from app.models.comparison import Comparison
from app.models.expert_invite import ExpertInvite, InviteStatus
from app.models.aggregated_result import AggregatedResult
from app.models.user import User
from app.schemas.result import ResultResponse, RankingItem
from app.dependencies import require_creator, get_current_user
from app.core.ahp.aggregation import aggregate_gmj, aggregate_gmp
from app.core.ahp.consistency import check_consistency
from app.core.ahp.hierarchy import build_criteria_tree, compute_global_weights

router = APIRouter()


@router.get("/cases/{case_id}/progress", response_model=dict)
async def get_progress(
    case_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    result = await db.execute(select(Case).where(Case.id == case_id, Case.creator_id == current_user.id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Case not found")

    invites_result = await db.execute(select(ExpertInvite).where(ExpertInvite.case_id == case_id))
    invites = invites_result.scalars().all()
    total = len(invites)
    completed = sum(1 for i in invites if i.status == InviteStatus.completed)
    return {
        "total_experts": total,
        "completed": completed,
        "pending": sum(1 for i in invites if i.status == InviteStatus.pending),
        "accepted": sum(1 for i in invites if i.status == InviteStatus.accepted),
        "completion_percent": round(completed / total * 100, 1) if total > 0 else 0,
    }


@router.post("/cases/{case_id}/aggregate", response_model=ResultResponse)
async def aggregate(
    case_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    # 1. Validasi kasus
    case_result = await db.execute(select(Case).where(Case.id == case_id, Case.creator_id == current_user.id))
    case = case_result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # 2. Ambil data
    criteria_result = await db.execute(select(Criteria).where(Criteria.case_id == case_id))
    criteria_rows = criteria_result.scalars().all()
    alt_result = await db.execute(select(Alternative).where(Alternative.case_id == case_id))
    alternatives = alt_result.scalars().all()
    if not criteria_rows or not alternatives:
        raise HTTPException(status_code=422, detail="Case must have criteria and alternatives")

    # 3. Ambil pakar yang sudah accepted/completed
    invite_result = await db.execute(
        select(ExpertInvite).where(
            ExpertInvite.case_id == case_id,
            ExpertInvite.status.in_([InviteStatus.accepted, InviteStatus.completed]),
        )
    )
    invites = invite_result.scalars().all()
    if not invites:
        raise HTTPException(status_code=422, detail="No expert has submitted comparisons yet")

    expert_ids = [inv.expert_id for inv in invites]

    # 4. Build criteria tree
    criteria_dicts = [{"id": str(c.id), "parent_id": str(c.parent_id) if c.parent_id else None, "label": c.label, "level": c.level} for c in criteria_rows]
    criteria_tree = build_criteria_tree(criteria_dicts)

    # 5. Identifikasi semua node_key yang perlu diagregasi
    # node_key = (node_type, parent_id_str)
    comp_result = await db.execute(
        select(Comparison).where(Comparison.case_id == case_id, Comparison.expert_id.in_(expert_ids))
    )
    all_comparisons = comp_result.scalars().all()

    # Group by (node_type, parent_id)
    from collections import defaultdict
    grouped: dict[tuple, list[Comparison]] = defaultdict(list)
    for comp in all_comparisons:
        key = (comp.node_type, str(comp.parent_id) if comp.parent_id else None)
        grouped[key].append(comp)

    # 6. Agregasi per node
    agg_method = case.aggregation_method
    comparisons_by_node = {}  # {None | criteria_id: np.array priority_vector}
    alt_comparisons = {}  # {criteria_id: {alt_id: weight}}

    for (node_type, parent_id_str), comps in grouped.items():
        matrices = [np.array(c.value_matrix) for c in comps]

        if agg_method == AggregationMethod.GMJ:
            agg_matrix = aggregate_gmj(matrices)
            result_dict = check_consistency(agg_matrix)
            pv = np.array(result_dict["priority_vector"])
        else:  # GMP
            pvs = [np.array(c.priority_vector) for c in comps if c.priority_vector]
            pv = aggregate_gmp(pvs)

        if node_type == "criteria":
            node_key = parent_id_str  # None = level 1, UUID = sub-kriteria parent
            # Urutkan sesuai criteria_rows order
            if parent_id_str is None:
                ordered_ids = [str(c.id) for c in sorted(criteria_rows, key=lambda x: x.order_index) if c.parent_id is None]
            else:
                ordered_ids = [str(c.id) for c in sorted(criteria_rows, key=lambda x: x.order_index) if str(c.parent_id) == parent_id_str]
            # pv urutan sesuai ordered_ids
            pv_dict = {cid: float(pv[i]) for i, cid in enumerate(ordered_ids)}
            comparisons_by_node[parent_id_str] = np.array([pv_dict.get(cid, 0.0) for cid in ordered_ids])
            comparisons_by_node[f"_ids_{parent_id_str}"] = ordered_ids

        elif node_type == "alternative":
            alt_ids_ordered = [str(a.id) for a in sorted(alternatives, key=lambda x: x.order_index)]
            alt_comparisons[parent_id_str] = {alt_ids_ordered[i]: float(pv[i]) for i in range(len(alt_ids_ordered))}

    # 7. Hitung global weights
    top_level_criteria_ids = comparisons_by_node.get("_ids_None", [str(c.id) for c in sorted(criteria_rows, key=lambda x: x.order_index) if c.parent_id is None])
    alt_ids = [str(a.id) for a in alternatives]

    global_weights = compute_global_weights(
        criteria_tree=criteria_tree,
        comparisons_by_node={k: v for k, v in comparisons_by_node.items() if not k.startswith("_ids_")},
        alternative_comparisons=alt_comparisons,
        criteria_ids=top_level_criteria_ids,
        alternative_ids=alt_ids,
    )

    # 8. Simpan atau update aggregated_results
    existing = await db.execute(select(AggregatedResult).where(AggregatedResult.case_id == case_id))
    existing_result = existing.scalar_one_or_none()

    criteria_weights_out = {k: float(v) for k, v in comparisons_by_node.items() if not k.startswith("_ids_") and k is not None}
    expert_priorities_out = {str(expert_id): {} for expert_id in expert_ids}

    if existing_result:
        existing_result.aggregation_method_used = agg_method
        existing_result.global_weights = {str(k): v for k, v in global_weights.items()}
        existing_result.criteria_weights = criteria_weights_out
        existing_result.expert_priorities = expert_priorities_out
        agg_result = existing_result
    else:
        agg_result = AggregatedResult(
            case_id=case_id,
            aggregation_method_used=agg_method,
            global_weights={str(k): v for k, v in global_weights.items()},
            criteria_weights=criteria_weights_out,
            expert_priorities=expert_priorities_out,
        )
        db.add(agg_result)
    await db.flush()

    # 9. Build ranking response
    alt_label_map = {str(a.id): a.label for a in alternatives}
    sorted_alts = sorted(global_weights.items(), key=lambda x: x[1], reverse=True)
    total_w = sum(global_weights.values()) or 1.0
    ranking = [
        RankingItem(
            rank=i + 1,
            alternative_id=UUID(aid),
            alternative_label=alt_label_map.get(aid, aid),
            global_weight=round(w, 6),
            percentage=round(w / total_w * 100, 2),
        )
        for i, (aid, w) in enumerate(sorted_alts)
    ]

    return ResultResponse(
        case_id=case_id,
        aggregation_method_used=agg_method,
        ranking=ranking,
        criteria_weights=criteria_weights_out,
        aggregate_cr=None,
        computed_at=agg_result.computed_at,
        experts_included=len(expert_ids),
    )


@router.get("/cases/{case_id}/results", response_model=ResultResponse)
async def get_results(
    case_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    agg_result = await db.execute(select(AggregatedResult).where(AggregatedResult.case_id == case_id))
    result = agg_result.scalar_one_or_none()
    if not result:
        raise HTTPException(status_code=404, detail="No aggregated results yet. Trigger /aggregate first.")

    alt_result = await db.execute(select(Alternative).where(Alternative.case_id == case_id))
    alternatives = alt_result.scalars().all()
    alt_label_map = {str(a.id): a.label for a in alternatives}

    global_weights = result.global_weights
    sorted_alts = sorted(global_weights.items(), key=lambda x: x[1], reverse=True)
    total_w = sum(global_weights.values()) or 1.0
    ranking = [
        RankingItem(
            rank=i + 1,
            alternative_id=UUID(aid),
            alternative_label=alt_label_map.get(aid, aid),
            global_weight=round(w, 6),
            percentage=round(w / total_w * 100, 2),
        )
        for i, (aid, w) in enumerate(sorted_alts)
    ]

    return ResultResponse(
        case_id=case_id,
        aggregation_method_used=result.aggregation_method_used,
        ranking=ranking,
        criteria_weights=result.criteria_weights,
        aggregate_cr=result.aggregate_cr,
        computed_at=result.computed_at,
        experts_included=len(result.expert_priorities),
    )

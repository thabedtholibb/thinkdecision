from typing import Annotated
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import numpy as np
from app.database import get_db
from app.models.comparison import Comparison
from app.models.expert_invite import ExpertInvite, InviteStatus
from app.models.criteria import Criteria
from app.models.alternative import Alternative
from app.models.case import Case
from app.models.user import User
from app.schemas.comparison import ComparisonCreate, ComparisonUpdate, ComparisonResponse
from app.dependencies import require_expert
from app.core.ahp.matrix import validate_matrix
from app.core.ahp.consistency import check_consistency

router = APIRouter()


async def _verify_expert_invite(case_id: UUID, expert_id: UUID, db: AsyncSession) -> ExpertInvite:
    result = await db.execute(
        select(ExpertInvite).where(
            ExpertInvite.case_id == case_id,
            ExpertInvite.expert_id == expert_id,
        )
    )
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=403, detail="Not invited to this case")
    return invite


@router.get("/expert/cases", response_model=list[dict])
async def list_expert_cases(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_expert)],
):
    result = await db.execute(
        select(ExpertInvite, Case)
        .join(Case, Case.id == ExpertInvite.case_id)
        .where(ExpertInvite.expert_id == current_user.id)
    )
    rows = result.all()
    return [
        {
            "case_id": str(row.Case.id),
            "title": row.Case.title,
            "method": row.Case.method,
            "invite_status": row.ExpertInvite.status,
            "invited_at": row.ExpertInvite.invited_at,
        }
        for row in rows
    ]


@router.get("/expert/cases/{case_id}", response_model=dict)
async def get_expert_case_detail(
    case_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_expert)],
):
    await _verify_expert_invite(case_id, current_user.id, db)
    case = await db.get(Case, case_id)
    criteria_result = await db.execute(select(Criteria).where(Criteria.case_id == case_id))
    alt_result = await db.execute(select(Alternative).where(Alternative.case_id == case_id))
    comp_result = await db.execute(
        select(Comparison).where(Comparison.case_id == case_id, Comparison.expert_id == current_user.id)
    )
    return {
        "case": {"id": str(case.id), "title": case.title, "method": case.method},
        "criteria": [{"id": str(c.id), "label": c.label, "parent_id": str(c.parent_id) if c.parent_id else None, "level": c.level} for c in criteria_result.scalars().all()],
        "alternatives": [{"id": str(a.id), "label": a.label} for a in alt_result.scalars().all()],
        "submitted_comparisons": [str(c.id) for c in comp_result.scalars().all()],
    }


@router.post("/expert/cases/{case_id}/comparisons", response_model=ComparisonResponse, status_code=201)
async def submit_comparison(
    case_id: UUID,
    body: ComparisonCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_expert)],
):
    invite = await _verify_expert_invite(case_id, current_user.id, db)

    is_valid, error_msg = validate_matrix(body.value_matrix)
    if not is_valid:
        raise HTTPException(status_code=422, detail=f"Invalid matrix: {error_msg}")

    matrix_np = np.array(body.value_matrix)
    consistency = check_consistency(matrix_np)

    # Cek apakah sudah ada (upsert)
    existing_result = await db.execute(
        select(Comparison).where(
            Comparison.case_id == case_id,
            Comparison.expert_id == current_user.id,
            Comparison.node_type == body.node_type,
            Comparison.parent_id == body.parent_id,
        )
    )
    existing = existing_result.scalar_one_or_none()

    if existing:
        existing.value_matrix = body.value_matrix
        existing.priority_vector = consistency["priority_vector"]
        existing.cr = consistency["cr"]
        existing.is_consistent = consistency["is_consistent"]
        existing.updated_at = datetime.utcnow()
        comp = existing
    else:
        comp = Comparison(
            case_id=case_id,
            expert_id=current_user.id,
            node_type=body.node_type,
            parent_id=body.parent_id,
            value_matrix=body.value_matrix,
            priority_vector=consistency["priority_vector"],
            cr=consistency["cr"],
            is_consistent=consistency["is_consistent"],
        )
        db.add(comp)

    # Update invite status ke accepted jika masih pending
    if invite.status == InviteStatus.pending:
        invite.status = InviteStatus.accepted
        invite.accepted_at = datetime.utcnow()

    await db.flush()
    return ComparisonResponse.model_validate(comp)


@router.get("/expert/cases/{case_id}/comparisons", response_model=list[ComparisonResponse])
async def get_expert_comparisons(
    case_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_expert)],
):
    await _verify_expert_invite(case_id, current_user.id, db)
    result = await db.execute(
        select(Comparison).where(Comparison.case_id == case_id, Comparison.expert_id == current_user.id)
    )
    return [ComparisonResponse.model_validate(c) for c in result.scalars().all()]

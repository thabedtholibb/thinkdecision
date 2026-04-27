from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.expert_invite import ExpertInvite, InviteStatus
from app.models.user import User, UserRole
from app.models.case import Case
from app.models.criteria import Criteria
from app.models.alternative import Alternative
from app.models.comparison import Comparison
from app.schemas.expert import ExpertInviteRequest, ExpertProgressResponse
from app.dependencies import require_creator

router = APIRouter()


def _count_required_comparisons(criteria_rows: list, has_alternatives: bool) -> int:
    """
    Hitung total matriks yang harus diisi oleh satu pakar.
    = 1 (antar kriteria level 1) + jumlah parent node (antar sub-kriteria)
    + jumlah leaf criteria (antar alternatif per kriteria)
    """
    parent_ids = {str(c.parent_id) for c in criteria_rows if c.parent_id is not None}
    leaf_count = sum(1 for c in criteria_rows if str(c.id) not in parent_ids)
    # 1 matriks kriteria level-1 + matriks per parent + matriks alternatif per leaf
    top_level_parents = sum(1 for c in criteria_rows if c.parent_id is not None)
    num_sub_comparisons = len(set(str(c.parent_id) for c in criteria_rows if c.parent_id is not None))
    if not has_alternatives:
        return 1 + num_sub_comparisons
    return 1 + num_sub_comparisons + leaf_count


@router.post("/cases/{case_id}/experts", status_code=201)
async def invite_expert(
    case_id: UUID,
    body: ExpertInviteRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    result = await db.execute(select(Case).where(Case.id == case_id, Case.creator_id == current_user.id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Case not found")

    # Cari expert user atau buat placeholder
    exp_result = await db.execute(select(User).where(User.email == body.email))
    expert = exp_result.scalar_one_or_none()
    if not expert:
        # Buat user dengan role expert (belum punya password, akan register sendiri)
        expert = User(email=body.email, full_name=body.email.split("@")[0], role=UserRole.expert)
        db.add(expert)
        await db.flush()

    # Cek sudah diundang?
    existing = await db.execute(
        select(ExpertInvite).where(ExpertInvite.case_id == case_id, ExpertInvite.expert_id == expert.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Expert already invited")

    invite = ExpertInvite(case_id=case_id, expert_id=expert.id)
    db.add(invite)
    await db.flush()
    return {"message": f"Expert {body.email} invited successfully", "invite_id": str(invite.id)}


@router.get("/cases/{case_id}/experts", response_model=list[ExpertProgressResponse])
async def list_experts(
    case_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    result = await db.execute(select(Case).where(Case.id == case_id, Case.creator_id == current_user.id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Case not found")

    invites_result = await db.execute(select(ExpertInvite).where(ExpertInvite.case_id == case_id))
    invites = invites_result.scalars().all()

    criteria_result = await db.execute(select(Criteria).where(Criteria.case_id == case_id))
    criteria_rows = criteria_result.scalars().all()

    alt_result = await db.execute(select(Alternative).where(Alternative.case_id == case_id))
    has_alternatives = len(alt_result.scalars().all()) > 0

    required = _count_required_comparisons(criteria_rows, has_alternatives)
    responses = []
    for invite in invites:
        expert = await db.get(User, invite.expert_id)
        comp_count_result = await db.execute(
            select(func.count()).where(Comparison.case_id == case_id, Comparison.expert_id == invite.expert_id)
        )
        submitted = comp_count_result.scalar() or 0
        progress = (submitted / required * 100) if required > 0 else 0
        responses.append(ExpertProgressResponse(
            expert_id=invite.expert_id,
            email=expert.email,
            full_name=expert.full_name,
            status=invite.status,
            invited_at=invite.invited_at,
            accepted_at=invite.accepted_at,
            completed_at=invite.completed_at,
            comparisons_submitted=submitted,
            comparisons_required=required,
            progress_percent=round(progress, 1),
        ))
    return responses


@router.delete("/cases/{case_id}/experts/{expert_id}", status_code=204)
async def remove_expert(
    case_id: UUID,
    expert_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    result = await db.execute(
        select(ExpertInvite).where(
            ExpertInvite.case_id == case_id,
            ExpertInvite.expert_id == expert_id,
            ExpertInvite.status == InviteStatus.pending,
        )
    )
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=404, detail="Pending invite not found")
    await db.delete(invite)

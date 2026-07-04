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
from app.dependencies import require_creator, require_expert
from app.models.aggregated_result import AggregatedResult

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


@router.get("/test-data")
async def get_test_data(db: Annotated[AsyncSession, Depends(get_db)]):
    """Debug endpoint to check data without authentication."""
    try:
        # Get first expert user
        expert_result = await db.execute(
            select(User).where(User.role == UserRole.expert).limit(1)
        )
        expert = expert_result.scalar_one_or_none()

        if not expert:
            return {"error": "No expert users found"}

        # Get invites for this expert
        invites_result = await db.execute(
            select(ExpertInvite).where(ExpertInvite.expert_id == expert.id)
        )
        invites = invites_result.scalars().all()

        return {
            "message": "Test data retrieved",
            "expert": {
                "id": str(expert.id),
                "email": expert.email,
                "name": expert.full_name
            },
            "invites_count": len(invites),
            "invites": [{"case_id": str(i.case_id), "status": str(i.status)} for i in invites]
        }
    except Exception as e:
        return {"error": str(e)}


@router.get("/dashboard")
async def get_expert_dashboard(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_expert)],
):
    """Get expert dashboard with invitations and statistics."""
    try:
        print(f"[Dashboard] Fetching data for expert: {current_user.email}")

        # Get all invites for this expert
        invites_result = await db.execute(
            select(ExpertInvite).where(ExpertInvite.expert_id == current_user.id)
        )
        invites = invites_result.scalars().all()
        print(f"[Dashboard] Found {len(invites)} invitations")

        # Build invitations with case details
        invitations = []
        active_cases = 0
        completed_cases = 0
        all_cr_values = []

        for invite in invites:
            try:
                case = await db.get(Case, invite.case_id)
                if not case:
                    print(f"[Dashboard] Case not found: {invite.case_id}")
                    continue

                # Calculate status from invite status
                status_str = str(invite.status).split('.')[-1] if invite.status else 'pending'
                print(f"[Dashboard] Case {case.name}: status_str={status_str}")

                if status_str == 'pending':
                    status = 'invited'
                    active_cases += 1
                elif status_str == 'accepted':
                    status = 'in_progress'
                    active_cases += 1
                elif status_str == 'completed':
                    status = 'completed'
                    completed_cases += 1
                else:
                    status = 'invited'
                    active_cases += 1

                # Get aggregated result for this case to get CR
                agg_result = await db.execute(
                    select(AggregatedResult).where(AggregatedResult.case_id == invite.case_id)
                )
                agg_obj = agg_result.scalar_one_or_none()
                if agg_obj:
                    print(f"[Dashboard] Case CR: {agg_obj.aggregate_cr}")
                    if agg_obj.aggregate_cr is not None:
                        all_cr_values.append(float(agg_obj.aggregate_cr))
                else:
                    print(f"[Dashboard] No aggregated result found for case {case.name}")

                invitations.append({
                    'case_id': str(case.id),
                    'caseId': str(case.id),
                    'cases': {
                        'id': str(case.id),
                        'name': case.name,
                        'method': case.method,
                        'deadline': case.deadline.isoformat() if case.deadline else None,
                        'users': {
                            'name': case.creator.full_name if case.creator else 'Unknown'
                        }
                    },
                    'name': case.name,
                    'method': case.method,
                    'deadline': case.deadline.isoformat() if case.deadline else None,
                    'creator': case.creator.full_name if case.creator else 'Unknown',
                    'status': status,
                    'invited_at': invite.invited_at.isoformat() if invite.invited_at else None,
                })
            except Exception as e:
                print(f"Error processing invite: {e}")
                continue

        # Calculate statistics
        total_contributions = len(invitations)
        avg_cr = (sum(all_cr_values) / len(all_cr_values)) if all_cr_values else 0.0

        print(f"[Dashboard] Final stats: active={active_cases}, completed={completed_cases}, avg_cr={avg_cr}, total={total_contributions}")

        return {
            'data': {
                'invitations': invitations,
                'stats': {
                    'activeCases': active_cases,
                    'completedCases': completed_cases,
                    'avgCR': round(avg_cr, 2),
                    'totalContributions': total_contributions
                }
            }
        }
    except Exception as e:
        print(f"Dashboard error: {e}")
        # Return default stats if there's an error
        return {
            'data': {
                'invitations': [],
                'stats': {
                    'activeCases': 0,
                    'completedCases': 0,
                    'avgCR': 0.0,
                    'totalContributions': 0
                }
            }
        }

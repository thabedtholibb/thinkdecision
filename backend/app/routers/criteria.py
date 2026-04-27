from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.criteria import Criteria
from app.models.case import Case
from app.models.user import User
from app.schemas.criteria import CriteriaCreate, CriteriaUpdate, CriteriaResponse
from app.dependencies import require_creator

router = APIRouter()


def build_tree(rows: list[Criteria]) -> list[CriteriaResponse]:
    """Konversi flat list ke nested tree untuk response."""
    nodes = {str(r.id): CriteriaResponse.model_validate(r) for r in rows}
    roots = []
    for node in nodes.values():
        if node.parent_id is None:
            roots.append(node)
        else:
            parent = nodes.get(str(node.parent_id))
            if parent:
                parent.children.append(node)
    return sorted(roots, key=lambda x: x.order_index)


@router.post("/cases/{case_id}/criteria", response_model=CriteriaResponse, status_code=201)
async def create_criteria(
    case_id: UUID,
    body: CriteriaCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    result = await db.execute(select(Case).where(Case.id == case_id, Case.creator_id == current_user.id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Case not found")
    level = 1
    if body.parent_id:
        parent = await db.get(Criteria, body.parent_id)
        if not parent:
            raise HTTPException(status_code=404, detail="Parent criteria not found")
        level = parent.level + 1
    criteria = Criteria(**body.model_dump(), case_id=case_id, level=level)
    db.add(criteria)
    await db.flush()
    return CriteriaResponse.model_validate(criteria)


@router.get("/cases/{case_id}/criteria", response_model=list[CriteriaResponse])
async def list_criteria(
    case_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    result = await db.execute(select(Criteria).where(Criteria.case_id == case_id).order_by(Criteria.order_index))
    return build_tree(result.scalars().all())


@router.patch("/criteria/{criteria_id}", response_model=CriteriaResponse)
async def update_criteria(
    criteria_id: UUID,
    body: CriteriaUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    criteria = await db.get(Criteria, criteria_id)
    if not criteria:
        raise HTTPException(status_code=404, detail="Criteria not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(criteria, field, value)
    await db.flush()
    return CriteriaResponse.model_validate(criteria)


@router.delete("/criteria/{criteria_id}", status_code=204)
async def delete_criteria(
    criteria_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    criteria = await db.get(Criteria, criteria_id)
    if not criteria:
        raise HTTPException(status_code=404, detail="Criteria not found")
    await db.delete(criteria)

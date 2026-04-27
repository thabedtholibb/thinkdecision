from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.alternative import Alternative
from app.models.case import Case
from app.models.user import User
from app.schemas.alternative import AlternativeCreate, AlternativeUpdate, AlternativeResponse
from app.dependencies import require_creator

router = APIRouter()


@router.post("/cases/{case_id}/alternatives", response_model=AlternativeResponse, status_code=201)
async def create_alternative(
    case_id: UUID,
    body: AlternativeCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    result = await db.execute(select(Case).where(Case.id == case_id, Case.creator_id == current_user.id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Case not found")
    alt = Alternative(**body.model_dump(), case_id=case_id)
    db.add(alt)
    await db.flush()
    return AlternativeResponse.model_validate(alt)


@router.get("/cases/{case_id}/alternatives", response_model=list[AlternativeResponse])
async def list_alternatives(
    case_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    result = await db.execute(select(Alternative).where(Alternative.case_id == case_id).order_by(Alternative.order_index))
    return [AlternativeResponse.model_validate(a) for a in result.scalars().all()]


@router.patch("/alternatives/{alt_id}", response_model=AlternativeResponse)
async def update_alternative(
    alt_id: UUID,
    body: AlternativeUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    alt = await db.get(Alternative, alt_id)
    if not alt:
        raise HTTPException(status_code=404, detail="Alternative not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(alt, field, value)
    await db.flush()
    return AlternativeResponse.model_validate(alt)


@router.delete("/alternatives/{alt_id}", status_code=204)
async def delete_alternative(
    alt_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    alt = await db.get(Alternative, alt_id)
    if not alt:
        raise HTTPException(status_code=404, detail="Alternative not found")
    await db.delete(alt)

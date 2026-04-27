from pydantic import BaseModel
from uuid import UUID
from typing import Optional


class CriteriaCreate(BaseModel):
    label: str
    description: Optional[str] = None
    parent_id: Optional[UUID] = None
    order_index: int = 0


class CriteriaUpdate(BaseModel):
    label: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None


class CriteriaResponse(BaseModel):
    id: UUID
    case_id: UUID
    parent_id: Optional[UUID]
    label: str
    description: Optional[str]
    level: int
    order_index: int
    children: list["CriteriaResponse"] = []

    model_config = {"from_attributes": True}


CriteriaResponse.model_rebuild()

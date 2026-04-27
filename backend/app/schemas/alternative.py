from pydantic import BaseModel
from uuid import UUID
from typing import Optional


class AlternativeCreate(BaseModel):
    label: str
    description: Optional[str] = None
    order_index: int = 0


class AlternativeUpdate(BaseModel):
    label: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None


class AlternativeResponse(BaseModel):
    id: UUID
    case_id: UUID
    label: str
    description: Optional[str]
    order_index: int

    model_config = {"from_attributes": True}

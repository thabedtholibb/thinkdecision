from pydantic import BaseModel, field_validator
from uuid import UUID
from datetime import datetime
from typing import Optional


class ComparisonCreate(BaseModel):
    node_type: str  # 'criteria' | 'alternative'
    parent_id: Optional[UUID] = None
    value_matrix: list[list[float]]

    @field_validator("node_type")
    @classmethod
    def validate_node_type(cls, v):
        if v not in ("criteria", "alternative"):
            raise ValueError("node_type must be 'criteria' or 'alternative'")
        return v


class ComparisonUpdate(BaseModel):
    value_matrix: list[list[float]]


class ComparisonResponse(BaseModel):
    id: UUID
    case_id: UUID
    expert_id: UUID
    node_type: str
    parent_id: Optional[UUID]
    value_matrix: list[list[float]]
    priority_vector: Optional[list[float]]
    cr: Optional[float]
    is_consistent: Optional[bool]
    submitted_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

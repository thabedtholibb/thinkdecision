from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.models.case import DecisionMethod, AggregationMethod, CaseStatus


class CaseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    method: DecisionMethod = DecisionMethod.AHP
    aggregation_method: AggregationMethod = AggregationMethod.GMJ


class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    aggregation_method: Optional[AggregationMethod] = None


class CaseStatusUpdate(BaseModel):
    status: CaseStatus


class CaseResponse(BaseModel):
    id: UUID
    creator_id: UUID
    title: str
    description: Optional[str]
    method: DecisionMethod
    aggregation_method: AggregationMethod
    status: CaseStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

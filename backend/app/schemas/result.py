from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.models.case import AggregationMethod


class AggregationTrigger(BaseModel):
    pass  # Tidak butuh body — gunakan setting dari Case


class RankingItem(BaseModel):
    rank: int
    alternative_id: UUID
    alternative_label: str
    global_weight: float
    percentage: float


class ResultResponse(BaseModel):
    case_id: UUID
    aggregation_method_used: AggregationMethod
    ranking: list[RankingItem]
    criteria_weights: dict
    aggregate_cr: Optional[float]
    computed_at: datetime
    experts_included: int

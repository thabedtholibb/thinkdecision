import uuid
from datetime import datetime
from sqlalchemy import Float, DateTime, ForeignKey, UniqueConstraint, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB
from app.database import Base
from app.models.case import AggregationMethod


class AggregatedResult(Base):
    __tablename__ = "aggregated_results"
    __table_args__ = (UniqueConstraint("case_id"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    case_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    aggregation_method_used: Mapped[AggregationMethod] = mapped_column(SAEnum(AggregationMethod), nullable=False)
    global_weights: Mapped[dict] = mapped_column(JSONB, nullable=False)
    criteria_weights: Mapped[dict] = mapped_column(JSONB, nullable=False)
    expert_priorities: Mapped[dict] = mapped_column(JSONB, nullable=False)
    aggregate_cr: Mapped[float | None] = mapped_column(Float, nullable=True)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

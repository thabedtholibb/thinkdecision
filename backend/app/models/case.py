import uuid
from datetime import datetime
from sqlalchemy import String, Text, Enum as SAEnum, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
import enum


class DecisionMethod(str, enum.Enum):
    AHP = "AHP"
    ANP = "ANP"
    FUZZY_AHP = "FUZZY_AHP"
    FUZZY_ANP = "FUZZY_ANP"


class AggregationMethod(str, enum.Enum):
    GMJ = "GMJ"
    GMP = "GMP"


class CaseStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    closed = "closed"


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    creator_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    method: Mapped[DecisionMethod] = mapped_column(SAEnum(DecisionMethod), nullable=False, default=DecisionMethod.AHP)
    aggregation_method: Mapped[AggregationMethod] = mapped_column(SAEnum(AggregationMethod), nullable=False, default=AggregationMethod.GMJ)
    status: Mapped[CaseStatus] = mapped_column(SAEnum(CaseStatus), nullable=False, default=CaseStatus.draft)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

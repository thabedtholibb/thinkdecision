import uuid
from datetime import datetime
from sqlalchemy import Enum as SAEnum, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
import enum


class InviteStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    completed = "completed"


class ExpertInvite(Base):
    __tablename__ = "expert_invites"
    __table_args__ = (UniqueConstraint("case_id", "expert_id"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    case_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    expert_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[InviteStatus] = mapped_column(SAEnum(InviteStatus), nullable=False, default=InviteStatus.pending)
    invited_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

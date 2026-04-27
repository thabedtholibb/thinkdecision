from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.models.expert_invite import InviteStatus


class ExpertInviteRequest(BaseModel):
    email: EmailStr


class ExpertProgressResponse(BaseModel):
    expert_id: UUID
    email: str
    full_name: str
    status: InviteStatus
    invited_at: datetime
    accepted_at: Optional[datetime]
    completed_at: Optional[datetime]
    comparisons_submitted: int
    comparisons_required: int
    progress_percent: float

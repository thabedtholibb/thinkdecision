#!/usr/bin/env python3
"""Check expert invitations in database."""

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.expert_invite import ExpertInvite
from app.models.user import User
from app.models.case import Case
from app.config import settings

async def check_invites():
    engine = create_async_engine(settings.database_url, echo=False)

    async with AsyncSession(engine) as session:
        try:
            # Get all expert invites
            result = await session.execute(select(ExpertInvite))
            invites = result.scalars().all()

            print(f"Total expert invites: {len(invites)}\n")

            for invite in invites:
                expert = await session.get(User, invite.expert_id)
                case = await session.get(Case, invite.case_id)

                print(f"Email: {expert.email if expert else 'N/A'}")
                print(f"  Status: {invite.status}")
                print(f"  Case: {case.name if case else 'N/A'}")
                print(f"  Invited: {invite.invited_at}")
                print()

            # Check if thabedoffice@gmail.com exists as expert
            user_result = await session.execute(
                select(User).where(User.email == "thabedoffice@gmail.com")
            )
            user = user_result.scalar_one_or_none()

            if user:
                print(f"\nUser found: {user.email}")
                print(f"  Name: {user.full_name}")
                print(f"  Role: {user.role}")
                print(f"  ID: {user.id}")
            else:
                print("\n✗ thabedoffice@gmail.com not found in database")

        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_invites())

#!/usr/bin/env python3
"""
Script untuk membuat test expert user di database.
Jalankan: python create_test_expert.py
"""

import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.models.user import User, UserRole
from app.database import Base
from app.config import settings
from argon2 import PasswordHasher

async def create_test_expert():
    """Create a test expert user."""

    # Create engine with echo for debugging
    engine = create_async_engine(
        settings.database_url,
        echo=False,
        future=True,
    )

    # Create session
    AsyncSessionLocal = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with AsyncSession(engine) as session:
        try:
            # Check if user already exists
            result = await session.execute(
                select(User).where(User.email == "thabedoffice@gmail.com")
            )
            existing_user = result.scalar_one_or_none()

            if existing_user:
                print(f"✓ User already exists: {existing_user.email}")
                print(f"  ID: {existing_user.id}")
                print(f"  Name: {existing_user.full_name}")
                print(f"  Role: {existing_user.role}")
                return

            # Hash password
            ph = PasswordHasher()
            hashed_password = ph.hash("thabedarema")

            # Create new expert user
            expert = User(
                email="thabedoffice@gmail.com",
                full_name="Prof. Thabed Tholib",
                password_hash=hashed_password,
                role=UserRole.expert
            )

            session.add(expert)
            await session.commit()

            print("✓ Expert user created successfully!")
            print(f"  Email: {expert.email}")
            print(f"  Name: {expert.full_name}")
            print(f"  Password: thabedarema")
            print(f"  ID: {expert.id}")

        except Exception as e:
            print(f"✗ Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_test_expert())

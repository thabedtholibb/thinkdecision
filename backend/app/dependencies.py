from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError
from app.database import get_db
from app.models.user import User
from app.config import settings


bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Decode JWT dari Supabase Auth, return User dari DB."""
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.supabase_anon_key,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def require_creator(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    from app.models.user import UserRole
    if current_user.role != UserRole.creator:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Creator access required")
    return current_user


async def require_expert(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    from app.models.user import UserRole
    if current_user.role != UserRole.expert:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Expert access required")
    return current_user

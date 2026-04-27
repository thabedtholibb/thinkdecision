from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from supabase import create_client
from app.database import get_db
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse, UserResponse
from app.dependencies import get_current_user
from app.config import settings

router = APIRouter()
supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: Annotated[AsyncSession, Depends(get_db)]):
    try:
        auth_response = supabase.auth.admin.create_user({
            "email": body.email,
            "password": body.password,
            "email_confirm": True,
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    supabase_user = auth_response.user
    db_user = User(
        id=supabase_user.id,
        email=body.email,
        full_name=body.full_name,
        role=body.role,
    )
    db.add(db_user)
    await db.flush()

    login_response = supabase.auth.sign_in_with_password({"email": body.email, "password": body.password})
    return AuthResponse(
        access_token=login_response.session.access_token,
        user=UserResponse.model_validate(db_user),
    )


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, db: Annotated[AsyncSession, Depends(get_db)]):
    try:
        login_response = supabase.auth.sign_in_with_password({"email": body.email, "password": body.password})
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found in database")

    return AuthResponse(
        access_token=login_response.session.access_token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
async def me(current_user: Annotated[User, Depends(get_current_user)]):
    return UserResponse.model_validate(current_user)

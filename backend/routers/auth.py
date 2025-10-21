"""
NeuroBridge AI - Authentication Router
Login, logout, token refresh endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from database import get_db
from schemas.auth import LoginRequest, LoginResponse, RefreshTokenRequest, TokenResponse, LogoutResponse
from schemas.common import APIResponse
from services.auth import AuthService
from services.audit import AuditService
from dependencies import get_current_user, get_request_context
from models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=APIResponse[LoginResponse])
async def login(
    login_data: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user and return JWT tokens.

    - **email**: User email address
    - **password**: User password
    - **mfa_code**: Optional MFA code if enabled

    Returns access_token, refresh_token, and user data.
    """
    context = await get_request_context(request)

    # Authenticate user
    user = await AuthService.authenticate_user(db, login_data.email, login_data.password)

    if not user:
        # Log failed login attempt
        await AuditService.log_action(
            db=db,
            action="login_failed",
            ip_address=context["ip_address"],
            user_agent=context["user_agent"]
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check MFA if enabled
    if user.mfa_enabled:
        if not login_data.mfa_code:
            raise HTTPException(
                status_code=status.HTTP_428_PRECONDITION_REQUIRED,
                detail="MFA code required"
            )

        # TODO: Verify MFA code (implement MFA service)
        # For now, we'll skip MFA verification in MVP
        pass

    # Generate token response
    token_response = AuthService.generate_token_response(user)

    # Update last login
    await AuthService.update_last_login(db, user)

    # Log successful login
    await AuditService.log_login(
        db=db,
        user=user,
        ip_address=context["ip_address"],
        user_agent=context["user_agent"],
        success=True
    )

    logger.info(f"User logged in: {user.email} (role={user.role})")

    return APIResponse(
        success=True,
        data=token_response
    )


@router.post("/refresh", response_model=APIResponse[TokenResponse])
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Refresh expired access token using refresh token.

    - **refresh_token**: Valid refresh token from login response

    Returns new access_token.
    """
    # Decode refresh token
    payload = AuthService.decode_token(refresh_data.refresh_token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Extract user data from token
    user_id = payload.get("sub")
    email = payload.get("email")
    role = payload.get("role")

    if not user_id or not email or not role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate new access token (refresh token remains the same)
    token_data = {
        "sub": user_id,
        "email": email,
        "role": role,
    }

    new_access_token = AuthService.create_access_token(token_data)

    from config import settings

    return APIResponse(
        success=True,
        data={
            "access_token": new_access_token,
            "refresh_token": refresh_data.refresh_token,  # Keep same refresh token
            "token_type": "bearer",
            "expires_in": settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
    )


@router.post("/logout", response_model=APIResponse[LogoutResponse])
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Logout current user (invalidate session).

    Requires valid JWT token in Authorization header.
    """
    context = await get_request_context(request)

    # Log logout
    await AuditService.log_logout(
        db=db,
        user=current_user,
        ip_address=context["ip_address"],
        user_agent=context["user_agent"]
    )

    logger.info(f"User logged out: {current_user.email}")

    # Note: In a production system, you would add the token to a blacklist
    # or use a session management system to truly invalidate the token.
    # For now, we just log the logout event.

    return APIResponse(
        success=True,
        data={"message": "Logged out successfully"}
    )


@router.get("/me", response_model=APIResponse[dict])
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user's profile data.

    Returns user data + role-specific information (Patient, Provider, or Admin).
    """
    profile_data = await AuthService.get_user_profile(db, current_user)

    return APIResponse(
        success=True,
        data={
            "user": current_user.to_dict(),
            "profile": profile_data["role_data"].to_dict() if profile_data["role_data"] else None
        }
    )

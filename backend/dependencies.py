"""
NeuroBridge AI - FastAPI Dependencies
Reusable dependencies for authentication, authorization, and request context
"""

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import logging

from database import get_db
from models.user import User, UserRole
from services.auth import AuthService

logger = logging.getLogger(__name__)

# HTTP Bearer token security scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user from JWT token.

    Args:
        credentials: HTTP Bearer token credentials
        db: Database session

    Returns:
        User object

    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials

    # Decode token
    payload = AuthService.decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Extract user ID from token
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Query user from database
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check user status
    if user.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account suspended"
        )

    if user.status == "inactive":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account inactive"
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to ensure user is active.

    Args:
        current_user: Current user from get_current_user

    Returns:
        User object if active

    Raises:
        HTTPException: If user is not active
    """
    if current_user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User status is {current_user.status}"
        )
    return current_user


def require_role(*allowed_roles: UserRole):
    """
    Dependency factory to require specific user roles.

    Usage:
        @router.get("/admin-only")
        async def admin_endpoint(
            user: User = Depends(require_role(UserRole.ADMIN))
        ):
            ...

    Args:
        allowed_roles: Tuple of allowed UserRole values

    Returns:
        Dependency function
    """
    async def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required roles: {[r.value for r in allowed_roles]}"
            )
        return current_user

    return role_checker


async def get_request_context(request: Request) -> dict:
    """
    Extract request context for audit logging.

    Args:
        request: FastAPI request object

    Returns:
        Dictionary with ip_address, user_agent, etc.
    """
    return {
        "ip_address": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent"),
        "method": request.method,
        "url": str(request.url)
    }


# Optional user dependency (doesn't raise exception if no token)
async def get_current_user_optional(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    Dependency to get current user if token is present, otherwise None.

    Args:
        request: FastAPI request
        db: Database session

    Returns:
        User object if authenticated, None otherwise
    """
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.replace("Bearer ", "")

    # Decode token
    payload = AuthService.decode_token(token)
    if not payload:
        return None

    # Extract user ID
    user_id = payload.get("sub")
    if not user_id:
        return None

    # Query user
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    return user

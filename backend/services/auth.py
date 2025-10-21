"""
NeuroBridge AI - Authentication Service
JWT token generation, password hashing, and user authentication
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

from config import settings
from models.user import User, UserStatus
from models.patient import Patient
from models.provider import Provider
from models.admin import Admin

logger = logging.getLogger(__name__)

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """
    Authentication service for user login, token generation, and password management.
    """

    @staticmethod
    def hash_password(password: str) -> str:
        """
        Hash a plain-text password using bcrypt.

        Args:
            password: Plain-text password

        Returns:
            Hashed password string
        """
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """
        Verify a plain-text password against a hashed password.

        Args:
            plain_password: Plain-text password to verify
            hashed_password: Hashed password from database

        Returns:
            True if password matches, False otherwise
        """
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """
        Create a JWT access token.

        Args:
            data: Payload data to encode in token
            expires_delta: Optional custom expiration time

        Returns:
            Encoded JWT token string
        """
        to_encode = data.copy()

        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)

        to_encode.update({"exp": expire, "iat": datetime.utcnow()})

        encoded_jwt = jwt.encode(
            to_encode,
            settings.JWT_SECRET,
            algorithm=settings.JWT_ALGORITHM
        )

        return encoded_jwt

    @staticmethod
    def create_refresh_token(data: dict) -> str:
        """
        Create a JWT refresh token (longer expiration).

        Args:
            data: Payload data to encode in token

        Returns:
            Encoded JWT token string
        """
        expires_delta = timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
        return AuthService.create_access_token(data, expires_delta)

    @staticmethod
    def decode_token(token: str) -> Optional[dict]:
        """
        Decode and validate a JWT token.

        Args:
            token: JWT token string

        Returns:
            Decoded token payload or None if invalid
        """
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms=[settings.JWT_ALGORITHM]
            )
            return payload
        except JWTError as e:
            logger.warning(f"JWT decode error: {e}")
            return None

    @staticmethod
    async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
        """
        Authenticate a user by email and password.

        Args:
            db: Database session
            email: User email
            password: Plain-text password

        Returns:
            User object if authenticated, None otherwise
        """
        # Query user by email
        result = await db.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one_or_none()

        if not user:
            logger.info(f"Login attempt for non-existent email: {email}")
            return None

        # Verify password
        if not AuthService.verify_password(password, user.password_hash):
            logger.info(f"Failed login attempt for email: {email}")
            return None

        # Check user status
        if user.status == UserStatus.SUSPENDED:
            logger.warning(f"Login attempt for suspended user: {email}")
            return None

        if user.status == UserStatus.INACTIVE:
            logger.warning(f"Login attempt for inactive user: {email}")
            return None

        return user

    @staticmethod
    async def get_user_profile(db: AsyncSession, user: User):
        """
        Get complete user profile based on role.

        Args:
            db: Database session
            user: User object

        Returns:
            Dictionary with user + role-specific data
        """
        profile_data = {
            "user": user,
            "role_data": None
        }

        if user.role == "patient":
            result = await db.execute(
                select(Patient).where(Patient.user_id == user.id)
            )
            profile_data["role_data"] = result.scalar_one_or_none()

        elif user.role == "provider" or user.role == "mentor":
            result = await db.execute(
                select(Provider).where(Provider.user_id == user.id)
            )
            profile_data["role_data"] = result.scalar_one_or_none()

        elif user.role == "admin":
            result = await db.execute(
                select(Admin).where(Admin.user_id == user.id)
            )
            profile_data["role_data"] = result.scalar_one_or_none()

        return profile_data

    @staticmethod
    async def update_last_login(db: AsyncSession, user: User):
        """
        Update user's last login timestamp.

        Args:
            db: Database session
            user: User object
        """
        user.last_login_at = datetime.utcnow()
        await db.commit()

    @staticmethod
    def generate_token_response(user: User) -> dict:
        """
        Generate complete token response for login.

        Args:
            user: Authenticated user

        Returns:
            Dictionary with access_token, refresh_token, and user data
        """
        # Create token payload
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
        }

        access_token = AuthService.create_access_token(token_data)
        refresh_token = AuthService.create_refresh_token(token_data)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "role": user.role.value if hasattr(user.role, 'value') else user.role,
                "status": user.status.value if hasattr(user.status, 'value') else user.status,
            }
        }

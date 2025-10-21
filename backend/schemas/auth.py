"""
NeuroBridge AI - Authentication Schemas
Pydantic models for auth endpoints
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class LoginRequest(BaseModel):
    """Login request schema"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="User password")
    mfa_code: Optional[str] = Field(None, min_length=6, max_length=6, description="MFA code if enabled")

    class Config:
        json_schema_extra = {
            "example": {
                "email": "provider@example.com",
                "password": "SecurePass123!",
                "mfa_code": "123456"
            }
        }


class UserResponse(BaseModel):
    """User data in token response"""
    id: str
    email: str
    role: str
    status: str

    class Config:
        json_schema_extra = {
            "example": {
                "id": "usr_abc123",
                "email": "provider@example.com",
                "role": "provider",
                "status": "active"
            }
        }


class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = Field(..., description="Expiration time in seconds")

    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGc...",
                "refresh_token": "eyJhbGc...",
                "token_type": "bearer",
                "expires_in": 900
            }
        }


class LoginResponse(BaseModel):
    """Complete login response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGc...",
                "refresh_token": "eyJhbGc...",
                "token_type": "bearer",
                "expires_in": 900,
                "user": {
                    "id": "usr_abc123",
                    "email": "provider@example.com",
                    "role": "provider",
                    "status": "active"
                }
            }
        }


class RefreshTokenRequest(BaseModel):
    """Refresh token request schema"""
    refresh_token: str = Field(..., description="Refresh token from login response")

    class Config:
        json_schema_extra = {
            "example": {
                "refresh_token": "eyJhbGc..."
            }
        }


class LogoutResponse(BaseModel):
    """Logout response schema"""
    message: str = "Logged out successfully"

    class Config:
        json_schema_extra = {
            "example": {
                "message": "Logged out successfully"
            }
        }

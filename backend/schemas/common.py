"""
NeuroBridge AI - Common Schemas
Shared Pydantic models for API responses
"""

from pydantic import BaseModel, Field
from typing import Generic, TypeVar, Optional, List, Any
from datetime import datetime

T = TypeVar('T')


class APIResponse(BaseModel, Generic[T]):
    """Standard API response wrapper"""
    success: bool = True
    data: Optional[T] = None
    error: Optional[dict] = None
    meta: dict = Field(default_factory=lambda: {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "version": "1.0.0"
    })

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {"key": "value"},
                "meta": {
                    "timestamp": "2025-10-21T14:30:00Z",
                    "version": "1.0.0"
                }
            }
        }


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated API response"""
    items: List[T]
    total: int
    page: int
    limit: int
    has_next: bool
    has_prev: bool

    class Config:
        json_schema_extra = {
            "example": {
                "items": [],
                "total": 100,
                "page": 1,
                "limit": 20,
                "has_next": True,
                "has_prev": False
            }
        }


class ErrorResponse(BaseModel):
    """Error response structure"""
    code: str
    message: str
    details: Optional[dict] = None

    class Config:
        json_schema_extra = {
            "example": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid input data",
                "details": {
                    "field": "email",
                    "issue": "Invalid email format"
                }
            }
        }

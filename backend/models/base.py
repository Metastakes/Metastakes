"""
NeuroBridge AI - Base Model Classes
Common fields and methods for all models
"""

from sqlalchemy import Column, String, DateTime, Integer, func
from sqlalchemy.dialects.postgresql import UUID
from database import Base
import uuid
from datetime import datetime


class BaseModel(Base):
    """
    Abstract base model with common fields:
    - id (UUID primary key)
    - created_at (timestamp)
    - updated_at (timestamp)
    - version (for optimistic locking)
    """

    __abstract__ = True

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    version = Column(Integer, default=1, nullable=False)

    def to_dict(self):
        """Convert model instance to dictionary"""
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }

    def __repr__(self):
        return f"<{self.__class__.__name__}(id={self.id})>"

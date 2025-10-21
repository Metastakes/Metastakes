"""
NeuroBridge AI - Admin Model
Admin/Staff users with flexible permissions
"""

from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from models.base import BaseModel


class Admin(BaseModel):
    """
    Admin/Staff model with role-based permissions.
    Links to User for authentication.
    """

    __tablename__ = "admins"

    # Foreign key to User
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Profile
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role_title = Column(String(100), nullable=True)  # e.g., "System Admin", "Clinical Director"

    # Flexible permissions structure
    permissions = Column(JSONB, nullable=True)

    # Relationships
    user = relationship("User", back_populates="admin")

    # System settings updated by this admin
    system_settings = relationship("SystemSetting", back_populates="updater")

    def __repr__(self):
        return f"<Admin(id={self.id}, name={self.first_name} {self.last_name}, role={self.role_title})>"

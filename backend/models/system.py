"""
NeuroBridge AI - System Setting Model
System-wide configuration storage
"""

from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from models.base import BaseModel


class SystemSetting(BaseModel):
    """
    System setting model for application configuration.
    Stores key-value pairs with JSONB values for flexibility.
    """

    __tablename__ = "system_settings"

    # Setting details
    setting_key = Column(String(100), unique=True, nullable=False)
    setting_value = Column(JSONB, nullable=False)
    description = Column(String, nullable=True)

    # Updated by
    updated_by = Column(UUID(as_uuid=True), ForeignKey("admins.id"), nullable=True)

    # Relationships
    updater = relationship("Admin", back_populates="system_settings")

    def __repr__(self):
        return f"<SystemSetting(key={self.setting_key}, value={self.setting_value})>"

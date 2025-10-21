"""
NeuroBridge AI - User Model
Universal authentication table for all portal users
"""

from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum, func
from sqlalchemy.orm import relationship
import enum
from models.base import BaseModel


class UserRole(str, enum.Enum):
    """User role enumeration"""
    PATIENT = "patient"
    PROVIDER = "provider"
    MENTOR = "mentor"
    ADMIN = "admin"


class UserStatus(str, enum.Enum):
    """User status enumeration"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"


class User(BaseModel):
    """
    User model for authentication across all portals.
    Links to specific role tables (Patient, Provider, Admin).
    """

    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, index=True)
    status = Column(SQLEnum(UserStatus), default=UserStatus.PENDING_VERIFICATION, index=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    password_changed_at = Column(DateTime(timezone=True), server_default=func.now())
    mfa_enabled = Column(Boolean, default=False)
    mfa_secret = Column(String(255), nullable=True)

    # Relationships (one-to-one with role-specific tables)
    patient = relationship("Patient", back_populates="user", uselist=False)
    provider = relationship("Provider", back_populates="user", uselist=False)
    admin = relationship("Admin", back_populates="user", uselist=False)

    # User badges
    user_badges = relationship("UserBadge", back_populates="user", cascade="all, delete-orphan")

    # Messages
    sent_messages = relationship(
        "Message",
        foreign_keys="Message.sender_id",
        back_populates="sender",
        cascade="all, delete-orphan"
    )
    received_messages = relationship(
        "Message",
        foreign_keys="Message.recipient_id",
        back_populates="recipient",
        cascade="all, delete-orphan"
    )

    # Audit logs
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"

    def to_dict(self, include_password=False):
        """Convert to dictionary, excluding password_hash by default"""
        data = super().to_dict()
        if not include_password:
            data.pop("password_hash", None)
            data.pop("mfa_secret", None)
        return data

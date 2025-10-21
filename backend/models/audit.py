"""
NeuroBridge AI - Audit Models
Audit logging and retention policy tracking
"""

from sqlalchemy import Column, String, Date, ForeignKey, DateTime, Enum as SQLEnum, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from sqlalchemy.orm import relationship
from models.base import BaseModel
from models.user import UserRole


class AuditLog(BaseModel):
    """
    Audit log model for HIPAA compliance.
    Immutable record of all system actions.
    Note: This table should NOT have update triggers - append-only.
    """

    __tablename__ = "audit_logs"

    # User performing action
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    user_role = Column(SQLEnum(UserRole), nullable=True)

    # Action details
    action = Column(String(100), nullable=False, index=True)  # e.g., 'patient_viewed', 'note_amended'
    resource_type = Column(String(100), nullable=True, index=True)  # e.g., 'patient', 'soap_note'
    resource_id = Column(UUID(as_uuid=True), nullable=True, index=True)

    # Change tracking
    old_values = Column(JSONB, nullable=True)
    new_values = Column(JSONB, nullable=True)

    # Request metadata
    ip_address = Column(INET, nullable=True)
    user_agent = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    session_id = Column(UUID(as_uuid=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="audit_logs")

    def __repr__(self):
        return f"<AuditLog(id={self.id}, action={self.action}, user_id={self.user_id}, timestamp={self.timestamp})>"


class RetentionPolicy(BaseModel):
    """
    Retention policy model for data lifecycle management.
    Tracks when patient records should be deleted (7 years or age 25 for minors).
    """

    __tablename__ = "retention_policies"

    # Foreign keys
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Patient metadata
    date_of_birth = Column(Date, nullable=False)
    is_minor_at_creation = Column(Boolean, default=False)

    # Retention calculation
    retention_until = Column(Date, nullable=False)  # 7 years from last contact OR age 25 if minor
    last_encounter_date = Column(Date, nullable=True)

    # Deletion tracking
    scheduled_deletion_date = Column(Date, nullable=True)
    deletion_executed_at = Column(DateTime(timezone=True), nullable=True)

    # Notes
    notes = Column(String, nullable=True)

    # Relationships
    patient = relationship("Patient", back_populates="retention_policy")

    def __repr__(self):
        return f"<RetentionPolicy(patient_id={self.patient_id}, retention_until={self.retention_until})>"

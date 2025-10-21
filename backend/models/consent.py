"""
NeuroBridge AI - Consent Model
Patient consents with e-signature tracking
"""

from sqlalchemy import Column, String, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, INET
from sqlalchemy.orm import relationship
import enum
from models.base import BaseModel


class ConsentType(str, enum.Enum):
    """Consent type enumeration"""
    TELEHEALTH = "telehealth"
    NPP = "npp"  # Notice of Privacy Practices
    ROI = "roi"  # Release of Information
    RECORDING = "recording"
    FINANCIAL = "financial"
    LATE_CANCEL = "late_cancel"


class ConsentStatus(str, enum.Enum):
    """Consent status enumeration"""
    PENDING = "pending"
    SIGNED = "signed"
    DECLINED = "declined"
    EXPIRED = "expired"
    REVOKED = "revoked"


class Consent(BaseModel):
    """
    Consent model for tracking patient consents.
    Supports e-signature with versioning.
    """

    __tablename__ = "consents"

    # Foreign keys
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)

    # Consent details
    consent_type = Column(SQLEnum(ConsentType), nullable=False)
    status = Column(SQLEnum(ConsentStatus), default=ConsentStatus.PENDING)
    version_number = Column(String(10), nullable=False)  # Track consent form versions

    # Consent text (full legal text)
    consent_text = Column(String, nullable=False)

    # Signature
    signed_at = Column(DateTime(timezone=True), nullable=True)
    signature_data = Column(String, nullable=True)  # Base64 or reference
    ip_address = Column(INET, nullable=True)

    # Expiration & Revocation
    expires_at = Column(DateTime(timezone=True), nullable=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    revocation_reason = Column(String, nullable=True)

    # Relationships
    patient = relationship("Patient", back_populates="consents")

    def __repr__(self):
        return f"<Consent(id={self.id}, type={self.consent_type}, status={self.status})>"

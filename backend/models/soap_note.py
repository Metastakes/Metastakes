"""
NeuroBridge AI - SOAP Note Model
Clinical documentation with billing codes
"""

from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Enum as SQLEnum, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from models.base import BaseModel


class NoteStatus(str, enum.Enum):
    """Note status enumeration"""
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    AMENDED = "amended"
    FINAL = "final"


class MDMLevel(str, enum.Enum):
    """Medical Decision Making level"""
    STRAIGHTFORWARD = "straightforward"
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"


class SOAPNote(BaseModel):
    """
    SOAP Note model for clinical documentation.
    One-to-one relationship with Encounter.
    """

    __tablename__ = "soap_notes"

    # Foreign keys
    encounter_id = Column(UUID(as_uuid=True), ForeignKey("encounters.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("providers.id"), nullable=False, index=True)

    # SOAP components
    subjective = Column(String, nullable=True)
    objective = Column(String, nullable=True)
    assessment = Column(String, nullable=True)
    plan = Column(String, nullable=True)

    # Status
    status = Column(SQLEnum(NoteStatus), default=NoteStatus.DRAFT, index=True)

    # Billing
    cpt_codes = Column(ARRAY(String(50)), nullable=True)
    icd10_codes = Column(ARRAY(String(10)), nullable=True)
    time_spent_minutes = Column(Integer, nullable=True)
    mdm_level = Column(SQLEnum(MDMLevel), nullable=True)
    billing_code = Column(String(10), nullable=True)  # Derived CPT code
    modifiers = Column(ARRAY(String(20)), nullable=True)

    # Mentor review
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("providers.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    review_feedback = Column(String, nullable=True)

    # Amendments
    amended_by = Column(UUID(as_uuid=True), ForeignKey("providers.id"), nullable=True)
    amendment_reason = Column(String, nullable=True)

    # Finalization
    finalized_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    encounter = relationship("Encounter", back_populates="soap_note")
    patient = relationship("Patient", back_populates="soap_notes")
    provider = relationship("Provider", back_populates="soap_notes")
    reviewer = relationship("Provider", foreign_keys=[reviewed_by], back_populates="reviewed_notes")

    def __repr__(self):
        return f"<SOAPNote(id={self.id}, encounter_id={self.encounter_id}, status={self.status})>"

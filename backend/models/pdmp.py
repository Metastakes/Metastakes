"""
NeuroBridge AI - PDMP Check Model
Prescription Drug Monitoring Program checks
"""

from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from models.base import BaseModel


class PDMPCheck(BaseModel):
    """
    PDMP Check model for E-FORCSE integration.
    Tracks prescription drug monitoring checks for controlled substances.
    """

    __tablename__ = "pdmp_checks"

    # Foreign keys
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("providers.id"), nullable=False)

    # Check details
    checked_at = Column(DateTime(timezone=True), nullable=False)
    state = Column(String(2), nullable=False)  # State abbreviation

    # PDMP response data
    report_data = Column(JSONB, nullable=True)  # Store E-FORCSE data
    red_flags = Column(JSONB, nullable=True)

    # Review
    requires_review = Column(Boolean, default=False)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("providers.id"), nullable=True)
    review_notes = Column(String, nullable=True)

    # Relationships
    patient = relationship("Patient", back_populates="pdmp_checks")
    provider = relationship("Provider", foreign_keys=[provider_id], back_populates="pdmp_checks")

    def __repr__(self):
        return f"<PDMPCheck(id={self.id}, patient_id={self.patient_id}, checked_at={self.checked_at})>"

"""
NeuroBridge AI - Diagnosis Model
ICD-10 diagnoses with status tracking
"""

from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from models.base import BaseModel


class DiagnosisStatus(str, enum.Enum):
    """Diagnosis status enumeration"""
    ACTIVE = "active"
    RESOLVED = "resolved"
    RULE_OUT = "rule_out"
    HISTORY_OF = "history_of"


class Diagnosis(BaseModel):
    """
    Diagnosis model for ICD-10 coded diagnoses.
    Tracks active and historical diagnoses for patients.
    """

    __tablename__ = "diagnoses"

    # Foreign keys
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    diagnosed_by = Column(UUID(as_uuid=True), ForeignKey("providers.id"), nullable=False)

    # Diagnosis details
    icd10_code = Column(String(10), nullable=False, index=True)
    description = Column(String, nullable=False)
    status = Column(SQLEnum(DiagnosisStatus), default=DiagnosisStatus.ACTIVE, index=True)
    is_primary = Column(Boolean, default=False)

    # Dates
    diagnosed_at = Column(DateTime(timezone=True), nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Notes
    notes = Column(String, nullable=True)

    # Relationships
    patient = relationship("Patient", back_populates="diagnoses")
    diagnostician = relationship("Provider", back_populates="diagnoses")

    def __repr__(self):
        return f"<Diagnosis(id={self.id}, icd10={self.icd10_code}, status={self.status})>"

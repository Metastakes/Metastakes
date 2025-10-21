"""
NeuroBridge AI - Encounter Model
Scheduled and completed patient visits
"""

from sqlalchemy import Column, String, DateTime, Integer, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from models.base import BaseModel


class EncounterStatus(str, enum.Enum):
    """Encounter status enumeration"""
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class EncounterType(str, enum.Enum):
    """Encounter type enumeration"""
    INITIAL_EVAL = "initial_eval"
    FOLLOW_UP = "follow_up"
    MED_MANAGEMENT = "med_management"
    GLP1_CONSULT = "glp1_consult"
    CRISIS = "crisis"


class Encounter(BaseModel):
    """
    Encounter model for scheduled and completed patient visits.
    Links to Patient, Provider, and optionally a Supervisor (Mentor).
    """

    __tablename__ = "encounters"

    # Foreign keys
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("providers.id"), nullable=False, index=True)
    supervisor_id = Column(UUID(as_uuid=True), ForeignKey("providers.id"), nullable=True)

    # Encounter details
    encounter_type = Column(SQLEnum(EncounterType), nullable=False)
    status = Column(SQLEnum(EncounterStatus), default=EncounterStatus.SCHEDULED, index=True)

    # Scheduling
    scheduled_start = Column(DateTime(timezone=True), nullable=False, index=True)
    scheduled_end = Column(DateTime(timezone=True), nullable=False)
    actual_start = Column(DateTime(timezone=True), nullable=True)
    actual_end = Column(DateTime(timezone=True), nullable=True)
    duration_minutes = Column(Integer, nullable=True)

    # Google Calendar/Meet integration
    google_meet_link = Column(String(500), nullable=True)
    google_calendar_event_id = Column(String(255), nullable=True)

    # Clinical
    chief_complaint = Column(String, nullable=True)

    # Cancellation
    is_no_show = Column(Boolean, default=False)
    late_cancel = Column(Boolean, default=False)
    cancellation_reason = Column(String, nullable=True)

    # Relationships
    patient = relationship("Patient", back_populates="encounters")
    provider = relationship("Provider", foreign_keys=[provider_id], back_populates="encounters")
    supervisor = relationship("Provider", foreign_keys=[supervisor_id], back_populates="supervised_encounters")

    # One-to-one relationships
    soap_note = relationship("SOAPNote", back_populates="encounter", uselist=False)
    transcript = relationship("Transcript", back_populates="encounter", uselist=False)

    # Payments
    payments = relationship("Payment", back_populates="encounter")

    def __repr__(self):
        return f"<Encounter(id={self.id}, type={self.encounter_type}, status={self.status})>"

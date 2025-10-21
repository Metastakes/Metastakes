"""
NeuroBridge AI - Provider Model
PMHNP provider credentials and supervision status
"""

from sqlalchemy import Column, String, Date, Integer, Boolean, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from models.base import BaseModel


class Provider(BaseModel):
    """
    Provider (PMHNP) model with credentials and supervision tracking.
    Links to User for authentication.
    """

    __tablename__ = "providers"

    # Foreign key to User
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Demographics
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    credentials = Column(String(50), nullable=True)  # e.g., PMHNP-BC

    # Credentials
    npi = Column(String(10), unique=True, nullable=False, index=True)
    dea_number = Column(String(20), nullable=True)
    dea_expiration_date = Column(Date, nullable=True)
    state_license_number = Column(String(50), nullable=True)
    state_license_state = Column(String(2), nullable=True)
    state_license_expiration = Column(Date, nullable=True)
    caqh_id = Column(String(20), nullable=True)

    # Professional Info
    specialty = Column(String(100), default="Psychiatric Mental Health")
    phone = Column(String(20), nullable=True)
    timezone = Column(String(50), default="America/New_York")

    # Mentorship
    is_mentor = Column(Boolean, default=False)
    mentor_capacity = Column(Integer, default=0)  # Max supervisees
    requires_supervision = Column(Boolean, default=True)
    supervisor_id = Column(UUID(as_uuid=True), ForeignKey("providers.id"), nullable=True, index=True)

    # Gamification & Scores
    gamification_points = Column(Integer, default=0)
    safety_score = Column(Numeric(5, 2), default=100.00)
    empathy_score = Column(Numeric(5, 2), default=0.00)
    documentation_score = Column(Numeric(5, 2), default=0.00)

    # Relationships
    user = relationship("User", back_populates="provider")

    # Self-referencing relationship for supervision
    supervisor = relationship("Provider", remote_side="Provider.id", foreign_keys=[supervisor_id])
    supervisees = relationship("Provider", back_populates="supervisor", foreign_keys=[supervisor_id])

    # Encounters as primary provider
    encounters = relationship(
        "Encounter",
        foreign_keys="Encounter.provider_id",
        back_populates="provider",
        cascade="all, delete-orphan"
    )

    # Encounters as supervisor
    supervised_encounters = relationship(
        "Encounter",
        foreign_keys="Encounter.supervisor_id",
        back_populates="supervisor"
    )

    # SOAP Notes
    soap_notes = relationship("SOAPNote", back_populates="provider", cascade="all, delete-orphan")

    # Reviewed notes (as mentor)
    reviewed_notes = relationship(
        "SOAPNote",
        foreign_keys="SOAPNote.reviewed_by",
        back_populates="reviewer"
    )

    # Transcripts
    transcripts = relationship("Transcript", back_populates="provider", cascade="all, delete-orphan")

    # Medications prescribed
    medications = relationship("Medication", back_populates="prescriber", cascade="all, delete-orphan")

    # Diagnoses made
    diagnoses = relationship("Diagnosis", back_populates="diagnostician", cascade="all, delete-orphan")

    # GLP-1 Programs
    glp1_programs = relationship("GLP1Program", back_populates="provider", cascade="all, delete-orphan")

    # PDMP Checks
    pdmp_checks = relationship("PDMPCheck", back_populates="provider", cascade="all, delete-orphan")

    # Insurance Claims
    insurance_claims = relationship("InsuranceClaim", back_populates="provider", cascade="all, delete-orphan")

    # Payouts
    payouts = relationship("ProviderPayout", back_populates="provider", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Provider(id={self.id}, name={self.first_name} {self.last_name}, npi={self.npi})>"

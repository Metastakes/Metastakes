"""
NeuroBridge AI - Patient Models
Patient demographics and clinical profile
"""

from sqlalchemy import Column, String, Date, Integer, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from models.base import BaseModel


class LanguagePreference(str, enum.Enum):
    """Language preference enumeration"""
    EN = "en"
    ES = "es"


class RiskLevel(str, enum.Enum):
    """Risk level enumeration"""
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"


class Patient(BaseModel):
    """
    Patient demographic and contact information.
    Links to User for authentication.
    """

    __tablename__ = "patients"

    # Foreign key to User
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Demographics
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False, index=True)
    date_of_birth = Column(Date, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    language_preference = Column(SQLEnum(LanguagePreference), default=LanguagePreference.EN)
    timezone = Column(String(50), default="America/New_York")

    # Address
    address_line1 = Column(String(255), nullable=True)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(2), nullable=True)
    zip_code = Column(String(10), nullable=True)

    # Emergency Contact
    emergency_contact_name = Column(String(200), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)
    emergency_contact_relationship = Column(String(50), nullable=True)

    # Gamification
    gamification_points = Column(Integer, default=0)
    current_streak_days = Column(Integer, default=0)
    longest_streak_days = Column(Integer, default=0)
    last_checkin_date = Column(Date, nullable=True)

    # Insurance (basic info)
    insurance_primary_payer = Column(String(100), nullable=True)
    insurance_member_id = Column(String(100), nullable=True)
    insurance_group_number = Column(String(100), nullable=True)

    # Relationships
    user = relationship("User", back_populates="patient")
    clinical_profile = relationship("ClinicalProfile", back_populates="patient", uselist=False)
    diagnoses = relationship("Diagnosis", back_populates="patient", cascade="all, delete-orphan")
    medications = relationship("Medication", back_populates="patient", cascade="all, delete-orphan")
    encounters = relationship("Encounter", back_populates="patient", cascade="all, delete-orphan")
    soap_notes = relationship("SOAPNote", back_populates="patient", cascade="all, delete-orphan")
    transcripts = relationship("Transcript", back_populates="patient", cascade="all, delete-orphan")
    consents = relationship("Consent", back_populates="patient", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="patient", cascade="all, delete-orphan")
    streaks = relationship("Streak", back_populates="patient", cascade="all, delete-orphan")
    glp1_programs = relationship("GLP1Program", back_populates="patient", cascade="all, delete-orphan")
    pdmp_checks = relationship("PDMPCheck", back_populates="patient", cascade="all, delete-orphan")
    retention_policy = relationship("RetentionPolicy", back_populates="patient", uselist=False)

    def __repr__(self):
        return f"<Patient(id={self.id}, name={self.first_name} {self.last_name})>"


class ClinicalProfile(BaseModel):
    """
    Comprehensive psychiatric and medical history (PHI).
    One-to-one relationship with Patient.
    """

    __tablename__ = "clinical_profiles"

    # Foreign key to Patient
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Chief Complaint & History
    chief_complaint = Column(String, nullable=True)
    psychiatric_history = Column(String, nullable=True)
    substance_use_history = Column(String, nullable=True)
    medical_history = Column(String, nullable=True)
    surgical_history = Column(String, nullable=True)
    family_psychiatric_history = Column(String, nullable=True)

    # Medications & Allergies
    allergies = Column(String, nullable=True)
    current_medications = Column(String, nullable=True)
    previous_medications = Column(String, nullable=True)
    hospitalization_history = Column(String, nullable=True)

    # Risk Assessment
    suicide_risk_level = Column(SQLEnum(RiskLevel), nullable=True)
    homicide_risk_level = Column(SQLEnum(RiskLevel), nullable=True)
    trauma_history = Column(String, nullable=True)

    # Social History
    social_history = Column(String, nullable=True)
    smoking_status = Column(String(50), nullable=True)
    alcohol_use = Column(String(50), nullable=True)
    caffeine_use = Column(String(50), nullable=True)
    exercise_frequency = Column(String(50), nullable=True)
    sleep_quality = Column(String(50), nullable=True)
    support_system = Column(String, nullable=True)
    employment_status = Column(String(50), nullable=True)
    living_situation = Column(String(100), nullable=True)

    # Relationship
    patient = relationship("Patient", back_populates="clinical_profile")

    def __repr__(self):
        return f"<ClinicalProfile(patient_id={self.patient_id})>"

"""
NeuroBridge AI - GLP-1 Models
Weight management program enrollment and progress
"""

from sqlalchemy import Column, String, Date, Boolean, Integer, ForeignKey, Numeric, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum
from models.base import BaseModel


class GLP1Agent(str, enum.Enum):
    """GLP-1 agent enumeration"""
    SEMAGLUTIDE = "semaglutide"
    LIRAGLUTIDE = "liraglutide"
    TIRZEPATIDE = "tirzepatide"
    DULAGLUTIDE = "dulaglutide"


class GLP1Status(str, enum.Enum):
    """GLP-1 program status enumeration"""
    BASELINE = "baseline"
    TITRATION = "titration"
    MAINTENANCE = "maintenance"
    DISCONTINUED = "discontinued"
    COMPLETED = "completed"


class GLP1Program(BaseModel):
    """
    GLP-1 Program model for weight management.
    Tracks patient enrollment and baseline metrics.
    """

    __tablename__ = "glp1_programs"

    # Foreign keys
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("providers.id"), nullable=False)

    # Program details
    agent = Column(SQLEnum(GLP1Agent), nullable=False)
    status = Column(SQLEnum(GLP1Status), default=GLP1Status.BASELINE)

    # Dates
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)

    # Baseline metrics
    baseline_weight = Column(Numeric(5, 2), nullable=True)
    baseline_bmi = Column(Numeric(4, 2), nullable=True)
    baseline_a1c = Column(Numeric(4, 2), nullable=True)
    target_weight = Column(Numeric(5, 2), nullable=True)

    # Current dosing
    current_dose = Column(String(50), nullable=True)
    titration_schedule = Column(JSONB, nullable=True)  # Structured dose progression

    # Safety screening
    contraindications_checked = Column(Boolean, default=False)
    thyroid_history = Column(String, nullable=True)
    pancreatitis_history = Column(Boolean, default=False)
    gallbladder_issues = Column(Boolean, default=False)
    renal_function_baseline = Column(String(50), nullable=True)

    # Progress tracking
    weekly_check_ins = Column(Integer, default=0)
    total_weight_lost = Column(Numeric(5, 2), default=0.00)
    adherence_percentage = Column(Numeric(5, 2), default=0.00)
    side_effects_reported = Column(String, nullable=True)

    # Relationships
    patient = relationship("Patient", back_populates="glp1_programs")
    provider = relationship("Provider", back_populates="glp1_programs")
    progress_logs = relationship("GLP1Progress", back_populates="program", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<GLP1Program(id={self.id}, patient_id={self.patient_id}, agent={self.agent}, status={self.status})>"


class GLP1Progress(BaseModel):
    """
    GLP-1 Progress model for weekly check-ins.
    Tracks weight, side effects, and adherence.
    """

    __tablename__ = "glp1_progress"

    # Foreign keys
    program_id = Column(UUID(as_uuid=True), ForeignKey("glp1_programs.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)

    # Check-in details
    check_in_date = Column(Date, nullable=False)

    # Metrics
    weight = Column(Numeric(5, 2), nullable=True)
    bmi = Column(Numeric(4, 2), nullable=True)

    # Patient-reported
    side_effects = Column(String, nullable=True)
    adherence_rating = Column(Integer, nullable=True)  # 1-10 scale
    mood_rating = Column(Integer, nullable=True)  # 1-10 scale
    energy_rating = Column(Integer, nullable=True)  # 1-10 scale
    notes = Column(String, nullable=True)

    # Provider review
    dose_adjustment = Column(String(50), nullable=True)
    provider_reviewed = Column(Boolean, default=False)

    # Relationships
    program = relationship("GLP1Program", back_populates="progress_logs")

    def __repr__(self):
        return f"<GLP1Progress(id={self.id}, program_id={self.program_id}, date={self.check_in_date})>"

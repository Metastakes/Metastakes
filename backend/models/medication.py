"""
NeuroBridge AI - Medication Model
Active and historical medication orders
"""

from sqlalchemy import Column, String, Integer, Boolean, Date, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from models.base import BaseModel


class MedicationStatus(str, enum.Enum):
    """Medication status enumeration"""
    ACTIVE = "active"
    DISCONTINUED = "discontinued"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"


class Medication(BaseModel):
    """
    Medication model for prescriptions.
    Tracks active and historical medications for patients.
    """

    __tablename__ = "medications"

    # Foreign keys
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    prescribed_by = Column(UUID(as_uuid=True), ForeignKey("providers.id"), nullable=False)

    # Medication details
    medication_name = Column(String(200), nullable=False)
    generic_name = Column(String(200), nullable=True)
    dosage = Column(String(100), nullable=False)
    frequency = Column(String(100), nullable=False)
    route = Column(String(50), default="PO")

    # Prescription details
    quantity = Column(Integer, nullable=True)
    refills = Column(Integer, default=0)

    # Controlled substance
    is_controlled_substance = Column(Boolean, default=False, index=True)
    dea_schedule = Column(String(10), nullable=True)

    # Status
    status = Column(SQLEnum(MedicationStatus), default=MedicationStatus.ACTIVE, index=True)
    prescribed_at = Column(DateTime(timezone=True), nullable=False)
    discontinued_at = Column(DateTime(timezone=True), nullable=True)
    discontinuation_reason = Column(String, nullable=True)

    # Pharmacy
    pharmacy_name = Column(String(200), nullable=True)
    pharmacy_phone = Column(String(20), nullable=True)
    pharmacy_address = Column(String, nullable=True)
    last_filled_date = Column(Date, nullable=True)

    # Notes
    notes = Column(String, nullable=True)

    # Relationships
    patient = relationship("Patient", back_populates="medications")
    prescriber = relationship("Provider", back_populates="medications")

    def __repr__(self):
        return f"<Medication(id={self.id}, name={self.medication_name}, status={self.status})>"

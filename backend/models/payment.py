"""
NeuroBridge AI - Payment Models
Payments, insurance claims, and provider payouts
"""

from sqlalchemy import Column, String, Integer, Date, ForeignKey, DateTime, Enum as SQLEnum, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum
from models.base import BaseModel


class PaymentStatus(str, enum.Enum):
    """Payment status enumeration"""
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"
    DISPUTED = "disputed"


class ClaimStatus(str, enum.Enum):
    """Insurance claim status enumeration"""
    DRAFT = "draft"
    SUBMITTED = "submitted"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    PAID = "paid"
    DENIED = "denied"
    APPEALED = "appealed"


class Payment(BaseModel):
    """
    Payment model for Stripe transactions.
    Tracks patient payments for encounters.
    """

    __tablename__ = "payments"

    # Foreign keys
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False, index=True)
    encounter_id = Column(UUID(as_uuid=True), ForeignKey("encounters.id"), nullable=True, index=True)

    # Stripe integration
    stripe_payment_intent_id = Column(String(255), unique=True, nullable=True)

    # Payment details
    amount_cents = Column(Integer, nullable=False)
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING, index=True)
    payment_method = Column(String(50), nullable=True)  # card, ach, etc.

    # Dates
    paid_at = Column(DateTime(timezone=True), nullable=True)
    refunded_at = Column(DateTime(timezone=True), nullable=True)
    refund_amount_cents = Column(Integer, nullable=True)

    # Failure tracking
    failure_reason = Column(String, nullable=True)

    # Metadata (flexible structure)
    metadata = Column(JSONB, nullable=True)

    # Relationships
    patient = relationship("Patient", back_populates="payments")
    encounter = relationship("Encounter", back_populates="payments")

    def __repr__(self):
        return f"<Payment(id={self.id}, amount=${self.amount_cents / 100:.2f}, status={self.status})>"


class InsuranceClaim(BaseModel):
    """
    Insurance claim model for billing.
    Tracks EDI 837 submissions and 835 remittances.
    """

    __tablename__ = "insurance_claims"

    # Foreign keys
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False, index=True)
    encounter_id = Column(UUID(as_uuid=True), ForeignKey("encounters.id"), nullable=False)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("providers.id"), nullable=False, index=True)

    # Payer information
    payer_name = Column(String(200), nullable=True)
    payer_id = Column(String(100), nullable=True)
    claim_number = Column(String(100), unique=True, nullable=True)

    # Status
    status = Column(SQLEnum(ClaimStatus), default=ClaimStatus.DRAFT, index=True)

    # Service details
    date_of_service = Column(Date, nullable=False, index=True)
    cpt_codes = Column(ARRAY(String(50)), nullable=False)
    icd10_codes = Column(ARRAY(String(10)), nullable=False)

    # Amounts (in cents)
    billed_amount_cents = Column(Integer, nullable=False)
    allowed_amount_cents = Column(Integer, nullable=True)
    paid_amount_cents = Column(Integer, nullable=True)
    patient_responsibility_cents = Column(Integer, nullable=True)

    # Dates
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)

    # Denial tracking
    denial_reason = Column(String, nullable=True)

    # Clearinghouse
    clearinghouse = Column(String(100), nullable=True)  # Availity, Waystar, etc.

    # EDI data (raw 837/835 responses)
    edi_837_data = Column(JSONB, nullable=True)
    edi_835_data = Column(JSONB, nullable=True)

    # Relationships
    patient = relationship("Patient")
    encounter = relationship("Encounter")
    provider = relationship("Provider", back_populates="insurance_claims")

    def __repr__(self):
        return f"<InsuranceClaim(id={self.id}, claim_number={self.claim_number}, status={self.status})>"


class ProviderPayout(BaseModel):
    """
    Provider payout model for Stripe Connect transfers.
    Aggregates provider earnings over a period.
    """

    __tablename__ = "provider_payouts"

    # Foreign keys
    provider_id = Column(UUID(as_uuid=True), ForeignKey("providers.id"), nullable=False, index=True)

    # Payout period
    payout_period_start = Column(Date, nullable=False)
    payout_period_end = Column(Date, nullable=False)

    # Summary
    total_encounters = Column(Integer, default=0)
    total_amount_cents = Column(Integer, nullable=False)

    # Stripe
    stripe_payout_id = Column(String(255), nullable=True)
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING)

    # Dates
    paid_at = Column(DateTime(timezone=True), nullable=True)

    # Notes
    notes = Column(String, nullable=True)

    # Relationships
    provider = relationship("Provider", back_populates="payouts")

    def __repr__(self):
        return f"<ProviderPayout(id={self.id}, provider_id={self.provider_id}, amount=${self.total_amount_cents / 100:.2f})>"

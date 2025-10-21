"""
NeuroBridge AI - Transcript Model
Session transcripts with AI analysis for training
"""

from sqlalchemy import Column, String, Boolean, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from models.base import BaseModel


class Transcript(BaseModel):
    """
    Transcript model for encounter transcripts with AI analysis.
    Used for AI training data with mentor corrections.
    """

    __tablename__ = "transcripts"

    # Foreign keys
    encounter_id = Column(UUID(as_uuid=True), ForeignKey("encounters.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("providers.id"), nullable=False, index=True)

    # Transcript
    transcript_text = Column(String, nullable=False)

    # AI Analysis (JSONB structure from Gemini)
    ai_analysis = Column(JSONB, nullable=True)

    # Extracted scores from AI analysis
    safety_score = Column(Numeric(5, 2), nullable=True)
    empathy_score = Column(Numeric(5, 2), nullable=True)
    documentation_quality_score = Column(Numeric(5, 2), nullable=True)

    # AI output
    red_flags = Column(JSONB, nullable=True)
    suggestions = Column(JSONB, nullable=True)

    # Mentor labeling for training
    mentor_labeled = Column(Boolean, default=False, index=True)
    mentor_corrections = Column(JSONB, nullable=True)  # Mentor overrides for AI training
    used_for_training = Column(Boolean, default=False)

    # Relationships
    encounter = relationship("Encounter", back_populates="transcript")
    patient = relationship("Patient", back_populates="transcripts")
    provider = relationship("Provider", back_populates="transcripts")

    def __repr__(self):
        return f"<Transcript(id={self.id}, encounter_id={self.encounter_id}, mentor_labeled={self.mentor_labeled})>"

"""
NeuroBridge AI - Gamification Models
Badges, user badges, and streaks
"""

from sqlalchemy import Column, String, Integer, Date, ForeignKey, DateTime, UniqueConstraint, func, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from models.base import BaseModel


class Badge(BaseModel):
    """
    Badge model for gamification achievements.
    Defines available badges that users can earn.
    """

    __tablename__ = "badges"

    # Badge details
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String, nullable=True)
    category = Column(String(50), nullable=True)  # patient, provider, mentor
    icon_url = Column(String(500), nullable=True)
    points_value = Column(Integer, default=0)

    # Relationships
    user_badges = relationship("UserBadge", back_populates="badge", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Badge(id={self.id}, code={self.code}, name={self.name})>"


class UserBadge(BaseModel):
    """
    UserBadge model - join table for users and badges.
    Tracks when a user earned a specific badge.
    """

    __tablename__ = "user_badges"
    __table_args__ = (
        UniqueConstraint('user_id', 'badge_id', name='uix_user_badge'),
    )

    # Foreign keys
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    badge_id = Column(UUID(as_uuid=True), ForeignKey("badges.id", ondelete="CASCADE"), nullable=False)

    # Earned timestamp
    earned_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="user_badges")
    badge = relationship("Badge", back_populates="user_badges")

    def __repr__(self):
        return f"<UserBadge(user_id={self.user_id}, badge_id={self.badge_id})>"


class Streak(BaseModel):
    """
    Streak model for tracking patient engagement.
    Records daily activities (check-ins, medication logs, etc.).
    """

    __tablename__ = "streaks"
    __table_args__ = (
        UniqueConstraint('patient_id', 'streak_date', 'activity_type', name='uix_patient_streak'),
    )

    # Foreign keys
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)

    # Streak details
    streak_date = Column(Date, nullable=False)
    activity_type = Column(String(50), nullable=True)  # check_in, medication, glp1_log
    points_earned = Column(Integer, default=0)

    # Relationships
    patient = relationship("Patient", back_populates="streaks")

    def __repr__(self):
        return f"<Streak(patient_id={self.patient_id}, date={self.streak_date}, type={self.activity_type})>"

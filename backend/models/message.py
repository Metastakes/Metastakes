"""
NeuroBridge AI - Message Model
In-app HIPAA-compliant messaging
"""

from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from models.base import BaseModel


class Message(BaseModel):
    """
    Message model for secure in-app messaging.
    Links patients with providers, mentors, etc.
    """

    __tablename__ = "messages"

    # Conversation grouping
    conversation_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    # Foreign keys
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # Message content
    message_text = Column(String, nullable=False)

    # Read status
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime(timezone=True), nullable=True)

    # Attachments
    attachment_url = Column(String(500), nullable=True)
    attachment_type = Column(String(50), nullable=True)

    # Encryption
    is_encrypted = Column(Boolean, default=True)

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    recipient = relationship("User", foreign_keys=[recipient_id], back_populates="received_messages")

    def __repr__(self):
        return f"<Message(id={self.id}, conversation_id={self.conversation_id}, is_read={self.is_read})>"

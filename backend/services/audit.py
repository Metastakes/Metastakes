"""
NeuroBridge AI - Audit Service
HIPAA-compliant audit logging for all system actions
"""

from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
import logging

from models.audit import AuditLog
from models.user import User, UserRole

logger = logging.getLogger(__name__)


class AuditService:
    """
    Service for creating and querying audit logs.
    All PHI access and modifications must be logged for HIPAA compliance.
    """

    @staticmethod
    async def log_action(
        db: AsyncSession,
        action: str,
        user: Optional[User] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[UUID] = None,
        old_values: Optional[dict] = None,
        new_values: Optional[dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        session_id: Optional[UUID] = None
    ):
        """
        Create an audit log entry.

        Args:
            db: Database session
            action: Action performed (e.g., 'patient_viewed', 'note_created')
            user: User performing the action (optional for system actions)
            resource_type: Type of resource (e.g., 'patient', 'soap_note')
            resource_id: ID of the resource
            old_values: Previous values (for updates)
            new_values: New values (for creates/updates)
            ip_address: Client IP address
            user_agent: Client user agent
            session_id: Session identifier
        """
        audit_log = AuditLog(
            user_id=user.id if user else None,
            user_role=user.role if user else None,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent,
            timestamp=datetime.utcnow(),
            session_id=session_id
        )

        db.add(audit_log)
        await db.commit()

        logger.info(
            f"Audit log created: action={action}, "
            f"user={user.id if user else 'system'}, "
            f"resource={resource_type}/{resource_id}"
        )

    @staticmethod
    async def log_phi_access(
        db: AsyncSession,
        user: User,
        resource_type: str,
        resource_id: UUID,
        ip_address: str,
        user_agent: str
    ):
        """
        Log PHI access (critical for HIPAA compliance).

        Args:
            db: Database session
            user: User accessing PHI
            resource_type: Type of PHI resource
            resource_id: ID of PHI resource
            ip_address: Client IP
            user_agent: Client user agent
        """
        await AuditService.log_action(
            db=db,
            action=f"{resource_type}_viewed",
            user=user,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent
        )

    @staticmethod
    async def log_login(
        db: AsyncSession,
        user: User,
        ip_address: str,
        user_agent: str,
        success: bool = True
    ):
        """
        Log user login attempt.

        Args:
            db: Database session
            user: User attempting login
            ip_address: Client IP
            user_agent: Client user agent
            success: Whether login was successful
        """
        action = "login_success" if success else "login_failed"

        await AuditService.log_action(
            db=db,
            action=action,
            user=user if success else None,
            ip_address=ip_address,
            user_agent=user_agent
        )

    @staticmethod
    async def log_logout(
        db: AsyncSession,
        user: User,
        ip_address: str,
        user_agent: str
    ):
        """
        Log user logout.

        Args:
            db: Database session
            user: User logging out
            ip_address: Client IP
            user_agent: Client user agent
        """
        await AuditService.log_action(
            db=db,
            action="logout",
            user=user,
            ip_address=ip_address,
            user_agent=user_agent
        )

    @staticmethod
    async def log_data_modification(
        db: AsyncSession,
        user: User,
        resource_type: str,
        resource_id: UUID,
        action: str,
        old_values: Optional[dict] = None,
        new_values: Optional[dict] = None,
        ip_address: Optional[str] = None
    ):
        """
        Log creation, update, or deletion of data.

        Args:
            db: Database session
            user: User modifying data
            resource_type: Type of resource
            resource_id: ID of resource
            action: Action performed (created, updated, deleted)
            old_values: Previous values
            new_values: New values
            ip_address: Client IP
        """
        await AuditService.log_action(
            db=db,
            action=f"{resource_type}_{action}",
            user=user,
            resource_type=resource_type,
            resource_id=resource_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address
        )

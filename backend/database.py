"""
NeuroBridge AI - Database Connection and Session Management
SQLAlchemy setup with async support
"""

from sqlalchemy import create_engine, event
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from sqlalchemy.pool import NullPool
from contextlib import asynccontextmanager
import logging

from config import settings

logger = logging.getLogger(__name__)

# Base class for all models
Base = declarative_base()

# Sync engine (for Alembic migrations)
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    echo=settings.DEBUG,
)

# Async engine (for FastAPI endpoints)
async_database_url = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
async_engine = create_async_engine(
    async_database_url,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    echo=settings.DEBUG,
    poolclass=NullPool if settings.ENVIRONMENT == "test" else None,
)

# Session factories
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=Session,
)

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


# Dependency for FastAPI endpoints
async def get_db() -> AsyncSession:
    """
    FastAPI dependency that provides an async database session.

    Usage:
        @app.get("/users")
        async def get_users(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@asynccontextmanager
async def get_db_context():
    """
    Context manager for database sessions outside of FastAPI endpoints.

    Usage:
        async with get_db_context() as db:
            result = await db.execute(...)
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# Sync session for Celery tasks
def get_sync_db() -> Session:
    """
    Provides a sync database session for Celery tasks.

    Usage:
        with get_sync_db() as db:
            result = db.query(...)
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


# Database initialization
async def init_db():
    """
    Initialize database (create tables if they don't exist).
    Note: In production, use Alembic migrations instead.
    """
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialized")


async def close_db():
    """Close database connections"""
    await async_engine.dispose()
    logger.info("Database connections closed")


# Event listeners for audit logging
@event.listens_for(engine, "connect")
def receive_connect(dbapi_conn, connection_record):
    """Set session configuration on connection"""
    cursor = dbapi_conn.cursor()
    # Set timezone to UTC
    cursor.execute("SET timezone='UTC'")
    cursor.close()

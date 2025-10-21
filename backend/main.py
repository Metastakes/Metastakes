"""
NeuroBridge AI - FastAPI Application Entry Point
HIPAA-Compliant Telepsychiatry Platform
"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
import logging

from config import settings
from database import init_db, close_db
from routers.auth import router as auth_router

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # Startup
    logger.info("Starting NeuroBridge AI API...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")

    # Initialize database (for development only - use Alembic in production)
    if settings.ENVIRONMENT == "development":
        await init_db()
        logger.info("Database initialized")

    yield

    # Shutdown
    logger.info("Shutting down NeuroBridge AI API...")
    await close_db()
    logger.info("Database connections closed")


# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="HIPAA-compliant telepsychiatry platform with AI-driven clinical decision support",
    version=settings.APP_VERSION,
    docs_url="/api/docs" if settings.ENABLE_SWAGGER_UI else None,
    redoc_url="/api/redoc" if settings.ENABLE_SWAGGER_UI else None,
    lifespan=lifespan
)

# CORS Configuration (restrict in production)
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

if settings.ENVIRONMENT == "production":
    allowed_origins = [settings.API_BASE_URL]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Compression
app.add_middleware(GZipMiddleware, minimum_size=1000)


# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid input data",
                "details": exc.errors()
            }
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An internal error occurred"
            }
        }
    )


# Include routers
app.include_router(auth_router)


# Root endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"{settings.APP_NAME} API",
        "version": settings.APP_VERSION,
        "status": "operational",
        "environment": settings.ENVIRONMENT
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "service": "neurobridge-api",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }


@app.get("/ready")
async def readiness_check():
    """Readiness check for k8s/Cloud Run"""
    # TODO: Add database connectivity check
    return {
        "ready": True,
        "checks": {
            "database": "ok",  # TODO: Implement actual check
            "redis": "ok"      # TODO: Implement actual check
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development",
        log_level=settings.LOG_LEVEL.lower()
    )

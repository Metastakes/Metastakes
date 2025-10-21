"""
NeuroBridge AI - FastAPI Application Entry Point
HIPAA-Compliant Telepsychiatry Platform
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="NeuroBridge AI API",
    description="HIPAA-compliant telepsychiatry platform with AI-driven clinical decision support",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS Configuration (restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Compression
app.add_middleware(GZipMiddleware, minimum_size=1000)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "NeuroBridge AI API",
        "version": "1.0.0",
        "status": "operational"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "service": "neurobridge-api",
        "version": "1.0.0"
    }


@app.get("/ready")
async def readiness_check():
    """Readiness check for k8s/Cloud Run"""
    # TODO: Add database connectivity check
    return {"ready": True}


# TODO: Import and include routers
# from routers import auth, patients, providers, encounters, ai
# app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
# app.include_router(patients.router, prefix="/api/patients", tags=["Patients"])
# app.include_router(providers.router, prefix="/api/providers", tags=["Providers"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

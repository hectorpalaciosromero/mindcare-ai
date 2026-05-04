"""MindCare AI — FastAPI application entry point."""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import engine, Base
from app.middleware import RequestLoggingMiddleware, SecurityHeadersMiddleware

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Production startup. Database schema must be managed entirely via Alembic.
    e.g. `alembic upgrade head`
    """
    yield

logging.basicConfig(level=logging.INFO, format="%(levelname)s [%(name)s] %(message)s")
settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API for MindCare AI — mental health platform powered by Gemini AI",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Middleware stack (order matters: last added = first executed)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routers import auth, patients, psychologists, admin

app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(psychologists.router)
app.include_router(admin.router)


@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


@app.get("/api/health", tags=["Health"])
def api_health():
    return {"status": "ok"}

import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from app.auth import require_admin_key
from app.database import engine, SessionLocal, Base, apply_inline_migrations
from app.models import Department
from app.routers import departments, jds, cvs, reviews, sheets

DEFAULT_DEPARTMENTS = ["Backend", "Frontend"]


def seed_departments(db: Session) -> None:
    """Create default departments if they don't already exist."""
    for name in DEFAULT_DEPARTMENTS:
        existing = db.query(Department).filter(Department.name == name).first()
        if not existing:
            db.add(Department(name=name))
    db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables, apply column additions, seed data
    Base.metadata.create_all(bind=engine)
    apply_inline_migrations()
    db = SessionLocal()
    try:
        seed_departments(db)
    finally:
        db.close()
    yield
    # Shutdown: nothing to clean up


app = FastAPI(
    title="CV Hub API",
    description="Backend API for CV review and job description matching.",
    version="1.0.0",
    lifespan=lifespan,
    dependencies=[Depends(require_admin_key)],
)

# CORS — allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(departments.router)
app.include_router(jds.router)
app.include_router(cvs.router)
app.include_router(reviews.router)
app.include_router(sheets.router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception on %s %s", request.method, request.url, exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )


@app.get("/")
async def root():
    return {"message": "CV Hub API is running."}

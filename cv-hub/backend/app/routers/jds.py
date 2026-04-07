from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Department, JobDescription
from app.schemas import JDCreate, JDUpdate, JDResponse

router = APIRouter(tags=["job_descriptions"])


# ─── All JDs ─────────────────────────────────────────────────────────────────


@router.get("/api/jds", response_model=list[JDResponse])
async def list_all_jds(db: Session = Depends(get_db)):
    """List all job descriptions across all departments."""
    return (
        db.query(JobDescription)
        .order_by(JobDescription.created_at.desc())
        .all()
    )


# ─── Scoped to department ────────────────────────────────────────────────────


@router.get(
    "/api/departments/{department_id}/jds", response_model=list[JDResponse]
)
async def list_jds_for_department(
        department_id: int, db: Session = Depends(get_db)
):
    """List all job descriptions for a department."""
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found.")

    jds = (
        db.query(JobDescription)
        .filter(JobDescription.department_id == department_id)
        .order_by(JobDescription.created_at.desc())
        .all()
    )
    return jds


@router.post(
    "/api/departments/{department_id}/jds",
    response_model=JDResponse,
    status_code=201,
)
async def create_jd_for_department(
        department_id: int,
        payload: JDCreate,
        db: Session = Depends(get_db),
):
    """Create a new job description under a department."""
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found.")

    jd = JobDescription(
        title=payload.title,
        description=payload.description,
        requirements=payload.requirements,
        department_id=department_id,
    )
    db.add(jd)
    db.commit()
    db.refresh(jd)
    return jd


# ─── Single JD operations ────────────────────────────────────────────────────


@router.get("/api/jds/{jd_id}", response_model=JDResponse)
async def get_jd(jd_id: int, db: Session = Depends(get_db)):
    """Get a single job description by ID."""
    jd = db.query(JobDescription).filter(JobDescription.id == jd_id).first()
    if not jd:
        raise HTTPException(status_code=404, detail="Job description not found.")
    return jd


@router.put("/api/jds/{jd_id}", response_model=JDResponse)
async def update_jd(
        jd_id: int, payload: JDUpdate, db: Session = Depends(get_db)
):
    """Update a job description."""
    jd = db.query(JobDescription).filter(JobDescription.id == jd_id).first()
    if not jd:
        raise HTTPException(status_code=404, detail="Job description not found.")

    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update.")

    for field, value in update_data.items():
        setattr(jd, field, value)

    db.commit()
    db.refresh(jd)
    return jd


@router.delete("/api/jds/{jd_id}", status_code=204)
async def delete_jd(jd_id: int, db: Session = Depends(get_db)):
    """Delete a job description."""
    jd = db.query(JobDescription).filter(JobDescription.id == jd_id).first()
    if not jd:
        raise HTTPException(status_code=404, detail="Job description not found.")

    db.delete(jd)
    db.commit()

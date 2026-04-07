from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Department
from app.schemas import DepartmentCreate, DepartmentResponse

router = APIRouter(prefix="/api/departments", tags=["departments"])


@router.get("", response_model=list[DepartmentResponse])
async def list_departments(db: Session = Depends(get_db)):
    """List all departments."""
    departments = db.query(Department).order_by(Department.id).all()
    return departments


@router.post("", response_model=DepartmentResponse, status_code=201)
async def create_department(
        payload: DepartmentCreate, db: Session = Depends(get_db)
):
    """Create a new department."""
    existing = db.query(Department).filter(Department.name == payload.name).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Department '{payload.name}' already exists.",
        )

    department = Department(name=payload.name)
    db.add(department)
    db.commit()
    db.refresh(department)
    return department

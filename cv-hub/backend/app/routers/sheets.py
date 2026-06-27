import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Department
from app.schemas import DepartmentResponse, SheetConfigUpdate, SheetSyncResult
from app.services.sheets_service import extract_sheet_id, sync_department

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/departments", tags=["sheets"])


@router.put("/{department_id}/sheet", response_model=DepartmentResponse)
async def set_department_sheet(
    department_id: int,
    payload: SheetConfigUpdate,
    db: Session = Depends(get_db),
):
    """Set or clear the Google Sheets URL for a department."""
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found.")

    raw = payload.sheet_url.strip()
    if not raw:
        department.sheet_id = None
    else:
        try:
            department.sheet_id = extract_sheet_id(raw)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    db.commit()
    db.refresh(department)
    return department


@router.delete("/{department_id}/sheet", response_model=DepartmentResponse)
async def clear_department_sheet(
    department_id: int, db: Session = Depends(get_db)
):
    """Disconnect the department from its Google Sheet."""
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found.")
    department.sheet_id = None
    department.last_synced_at = None
    db.commit()
    db.refresh(department)
    return department


@router.post("/{department_id}/sheets/sync", response_model=SheetSyncResult)
async def sync_department_sheet(
    department_id: int, db: Session = Depends(get_db)
):
    """Two-way sync between this department's CVs and its Google Sheet."""
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found.")
    if not department.sheet_id:
        raise HTTPException(
            status_code=400,
            detail="No Google Sheet configured for this department.",
        )

    try:
        result = sync_department(department, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        logger.exception("Sheet sync failed for department %s", department_id)
        raise HTTPException(status_code=502, detail=str(e))
    return result

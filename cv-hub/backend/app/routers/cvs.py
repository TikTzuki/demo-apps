import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from sqlalchemy import func

from app.models import CV, CVReview, CVJDMatch, Department
from app.schemas import CVResponse, CVDetailResponse, CVReviewResponse, CVStatusUpdate
from app.services.pdf_service import extract_text_from_pdf

router = APIRouter(tags=["cvs"])


# ─── List CVs for a department ────────────────────────────────────────────────


@router.get(
    "/api/departments/{department_id}/cvs", response_model=list[CVResponse]
)
async def list_cvs_for_department(
        department_id: int,
        status: str | None = None,
        db: Session = Depends(get_db),
):
    """List all CVs uploaded to a department. Optional ?status=pending|passed|failed filter."""
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found.")

    query = db.query(CV).filter(CV.department_id == department_id)
    if status:
        query = query.filter(CV.status == status)
    cvs = query.order_by(CV.uploaded_at.desc()).all()

    # Build response with scores
    result = []
    for cv in cvs:
        review_score = None
        if cv.review:
            review_score = cv.review.overall_score

        best_match = (
            db.query(func.max(CVJDMatch.match_percentage))
            .filter(CVJDMatch.cv_id == cv.id)
            .scalar()
        )

        result.append(CVResponse(
            id=cv.id,
            filename=cv.filename,
            original_filename=cv.original_filename,
            department_id=cv.department_id,
            uploaded_at=cv.uploaded_at,
            file_path=cv.file_path,
            extracted_text=cv.extracted_text,
            status=cv.status,
            review_score=review_score,
            best_match_percentage=best_match,
        ))

    return result


# ─── Upload CV ────────────────────────────────────────────────────────────────


@router.post(
    "/api/departments/{department_id}/cvs",
    response_model=CVResponse,
    status_code=201,
)
async def upload_cv(
        department_id: int,
        file: UploadFile = File(...),
        db: Session = Depends(get_db),
):
    """Upload a PDF CV to a department."""
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found.")

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400, detail="Only PDF files are accepted."
        )

    # Generate a unique filename
    ext = Path(file.filename).suffix
    unique_name = f"{uuid.uuid4()}{ext}"
    upload_dir = settings.upload_path
    file_path = upload_dir / unique_name

    # Save file to disk
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    # Extract text from PDF
    extracted_text = ""
    try:
        extracted_text = extract_text_from_pdf(str(file_path))
    except Exception:
        # If extraction fails, we still save the CV but with empty text
        extracted_text = ""

    cv = CV(
        filename=unique_name,
        original_filename=file.filename,
        department_id=department_id,
        file_path=str(file_path),
        extracted_text=extracted_text,
        status_updated_at=datetime.now(timezone.utc),
    )
    db.add(cv)
    db.commit()
    db.refresh(cv)
    return cv


# ─── Get CV details ──────────────────────────────────────────────────────────


@router.get("/api/cvs/{cv_id}", response_model=CVDetailResponse)
async def get_cv(cv_id: int, db: Session = Depends(get_db)):
    """Get CV details including review if it exists."""
    cv = db.query(CV).filter(CV.id == cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found.")

    # Build response manually to handle review JSON fields
    review_data = None
    if cv.review:
        review_data = CVReviewResponse(
            id=cv.review.id,
            cv_id=cv.review.cv_id,
            review_text=cv.review.review_text,
            strengths=json.loads(cv.review.strengths),
            weaknesses=json.loads(cv.review.weaknesses),
            overall_score=cv.review.overall_score,
            created_at=cv.review.created_at,
            updated_at=cv.review.updated_at,
        )

    return CVDetailResponse(
        id=cv.id,
        filename=cv.filename,
        original_filename=cv.original_filename,
        department_id=cv.department_id,
        uploaded_at=cv.uploaded_at,
        file_path=cv.file_path,
        extracted_text=cv.extracted_text,
        status=cv.status,
        review=review_data,
    )


# ─── Update CV status ────────────────────────────────────────────────────────


@router.patch("/api/cvs/{cv_id}/status", response_model=CVResponse)
async def update_cv_status(
        cv_id: int, payload: CVStatusUpdate, db: Session = Depends(get_db)
):
    """Update CV status to passed, failed, or pending."""
    cv = db.query(CV).filter(CV.id == cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found.")

    if cv.status != payload.status:
        cv.status = payload.status
        cv.status_updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(cv)

    review_score = cv.review.overall_score if cv.review else None
    best_match = (
        db.query(func.max(CVJDMatch.match_percentage))
        .filter(CVJDMatch.cv_id == cv.id)
        .scalar()
    )

    return CVResponse(
        id=cv.id,
        filename=cv.filename,
        original_filename=cv.original_filename,
        department_id=cv.department_id,
        uploaded_at=cv.uploaded_at,
        file_path=cv.file_path,
        extracted_text=cv.extracted_text,
        status=cv.status,
        review_score=review_score,
        best_match_percentage=best_match,
    )


# ─── Delete CV ────────────────────────────────────────────────────────────────


@router.delete("/api/cvs/{cv_id}", status_code=204)
async def delete_cv(cv_id: int, db: Session = Depends(get_db)):
    """Delete a CV and its file from disk."""
    cv = db.query(CV).filter(CV.id == cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found.")

    # Delete file from disk
    file_path = Path(cv.file_path)
    if file_path.exists():
        file_path.unlink()

    db.delete(cv)
    db.commit()


# ─── Serve PDF file ──────────────────────────────────────────────────────────


@router.get("/api/cvs/{cv_id}/file")
async def serve_cv_file(
        cv_id: int, download: bool = False, db: Session = Depends(get_db)
):
    """Serve the original PDF file. Use ?download=true to force download."""
    cv = db.query(CV).filter(CV.id == cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found.")

    file_path = Path(cv.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="PDF file not found on disk.")

    if download:
        return FileResponse(
            path=str(file_path),
            filename=cv.original_filename,
            media_type="application/pdf",
        )

    # Serve inline for iframe/preview (no Content-Disposition: attachment)
    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        content_disposition_type="inline",
    )

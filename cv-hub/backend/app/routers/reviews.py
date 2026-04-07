import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from app.database import get_db
from app.models import CV, CVReview, CVJDMatch, JobDescription
from app.schemas import CVReviewResponse, CVJDMatchResponse, MatchedItem, ReviewRequest
from app.services.ai_service_http import review_cv, match_cv_jd

router = APIRouter(tags=["reviews"])


# ─── Trigger AI review ───────────────────────────────────────────────────────


@router.post("/api/cvs/{cv_id}/review", response_model=CVReviewResponse)
async def trigger_review(
        cv_id: int,
        payload: ReviewRequest = ReviewRequest(),
        db: Session = Depends(get_db),
):
    """Trigger an AI review for a CV. Creates a new review or updates existing one."""
    cv = db.query(CV).filter(CV.id == cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found.")

    if not cv.extracted_text or not cv.extracted_text.strip():
        raise HTTPException(
            status_code=400,
            detail="CV has no extracted text. Cannot perform review.",
        )

    # Call AI service
    try:
        result = review_cv(cv.extracted_text, note=payload.note)
    except Exception as e:
        logger.error("AI review failed for CV %s", cv_id, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"AI review failed: {str(e)}",
        )

    strengths_json = json.dumps(result["strengths"])
    weaknesses_json = json.dumps(result["weaknesses"])

    # Check if review already exists (upsert)
    existing_review = db.query(CVReview).filter(CVReview.cv_id == cv_id).first()

    if existing_review:
        existing_review.review_text = result["review_text"]
        existing_review.strengths = strengths_json
        existing_review.weaknesses = weaknesses_json
        existing_review.overall_score = result["overall_score"]
        existing_review.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing_review)
        review = existing_review
    else:
        review = CVReview(
            cv_id=cv_id,
            review_text=result["review_text"],
            strengths=strengths_json,
            weaknesses=weaknesses_json,
            overall_score=result["overall_score"],
        )
        db.add(review)
        db.commit()
        db.refresh(review)

    return CVReviewResponse(
        id=review.id,
        cv_id=review.cv_id,
        review_text=review.review_text,
        strengths=json.loads(review.strengths),
        weaknesses=json.loads(review.weaknesses),
        overall_score=review.overall_score,
        created_at=review.created_at,
        updated_at=review.updated_at,
    )


# ─── Get review ──────────────────────────────────────────────────────────────


@router.get("/api/cvs/{cv_id}/review", response_model=CVReviewResponse)
async def get_review(cv_id: int, db: Session = Depends(get_db)):
    """Get the AI review for a CV."""
    cv = db.query(CV).filter(CV.id == cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found.")

    review = db.query(CVReview).filter(CVReview.cv_id == cv_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="No review found for this CV.")

    return CVReviewResponse(
        id=review.id,
        cv_id=review.cv_id,
        review_text=review.review_text,
        strengths=json.loads(review.strengths),
        weaknesses=json.loads(review.weaknesses),
        overall_score=review.overall_score,
        created_at=review.created_at,
        updated_at=review.updated_at,
    )


# ─── Trigger JD match ────────────────────────────────────────────────────────


@router.post(
    "/api/cvs/{cv_id}/match/{jd_id}", response_model=CVJDMatchResponse
)
async def trigger_jd_match(
        cv_id: int, jd_id: int, db: Session = Depends(get_db)
):
    """Trigger an AI match analysis between a CV and a job description."""
    cv = db.query(CV).filter(CV.id == cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found.")

    if not cv.extracted_text or not cv.extracted_text.strip():
        raise HTTPException(
            status_code=400,
            detail="CV has no extracted text. Cannot perform matching.",
        )

    jd = db.query(JobDescription).filter(JobDescription.id == jd_id).first()
    if not jd:
        raise HTTPException(status_code=404, detail="Job description not found.")

    # Call AI service
    try:
        result = match_cv_jd(
            cv_text=cv.extracted_text,
            jd_title=jd.title,
            jd_description=jd.description,
            jd_requirements=jd.requirements,
        )
    except Exception as e:
        logger.error("AI matching failed for CV %s / JD %s", cv_id, jd_id, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"AI matching failed: {str(e)}",
        )

    # Upsert on (cv_id, jd_id)
    existing_match = (
        db.query(CVJDMatch)
        .filter(CVJDMatch.cv_id == cv_id, CVJDMatch.jd_id == jd_id)
        .first()
    )

    matched_items_json = json.dumps(result.get("matched_items", []), ensure_ascii=False)

    if existing_match:
        existing_match.match_percentage = result["match_percentage"]
        existing_match.match_details = result["match_details"]
        existing_match.matched_items = matched_items_json
        existing_match.created_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing_match)
        match_record = existing_match
    else:
        match_record = CVJDMatch(
            cv_id=cv_id,
            jd_id=jd_id,
            match_percentage=result["match_percentage"],
            match_details=result["match_details"],
            matched_items=matched_items_json,
        )
        db.add(match_record)
        db.commit()
        db.refresh(match_record)

    return CVJDMatchResponse(
        id=match_record.id,
        cv_id=match_record.cv_id,
        jd_id=match_record.jd_id,
        match_percentage=match_record.match_percentage,
        match_details=match_record.match_details,
        matched_items=json.loads(match_record.matched_items) if match_record.matched_items else [],
        created_at=match_record.created_at,
    )


# ─── Get all matches for a CV ─────────────────────────────────────────────────


@router.get(
    "/api/cvs/{cv_id}/matches", response_model=list[CVJDMatchResponse]
)
async def get_cv_matches(cv_id: int, db: Session = Depends(get_db)):
    """Get all JD match results for a CV."""
    cv = db.query(CV).filter(CV.id == cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found.")

    matches = (
        db.query(CVJDMatch)
        .filter(CVJDMatch.cv_id == cv_id)
        .order_by(CVJDMatch.created_at.desc())
        .all()
    )
    return [
        CVJDMatchResponse(
            id=m.id,
            cv_id=m.cv_id,
            jd_id=m.jd_id,
            match_percentage=m.match_percentage,
            match_details=m.match_details,
            matched_items=json.loads(m.matched_items) if m.matched_items else [],
            created_at=m.created_at,
        )
        for m in matches
    ]

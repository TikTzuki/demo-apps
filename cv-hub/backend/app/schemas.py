from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# ─── Department ───────────────────────────────────────────────────────────────


class DepartmentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class DepartmentResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    sheet_id: Optional[str] = None
    last_synced_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class SheetConfigUpdate(BaseModel):
    sheet_url: str = Field(..., min_length=1)


class SheetSyncResult(BaseModel):
    department_id: int
    rows_pushed: int
    status_updates_applied: int
    conflicts_skipped: int
    invalid_status_values: int
    synced_at: str


# ─── Job Description ─────────────────────────────────────────────────────────


class JDCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    requirements: str = Field(..., min_length=1)


class JDUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1)
    requirements: Optional[str] = Field(None, min_length=1)


class JDResponse(BaseModel):
    id: int
    title: str
    description: str
    requirements: str
    department_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── CV ───────────────────────────────────────────────────────────────────────


class CVResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    department_id: int
    uploaded_at: datetime
    file_path: str
    extracted_text: Optional[str] = None
    status: str = "pending"
    review_score: Optional[float] = None
    best_match_percentage: Optional[float] = None

    model_config = {"from_attributes": True}


class CVDetailResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    department_id: int
    uploaded_at: datetime
    file_path: str
    extracted_text: Optional[str] = None
    status: str = "pending"
    review: Optional["CVReviewResponse"] = None

    model_config = {"from_attributes": True}


class CVStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|passed|failed)$")


# ─── CV Review ────────────────────────────────────────────────────────────────


class ReviewRequest(BaseModel):
    note: str = ""


class CVReviewResponse(BaseModel):
    id: int
    cv_id: int
    review_text: str
    strengths: list[str]
    weaknesses: list[str]
    overall_score: float
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── CV-JD Match ─────────────────────────────────────────────────────────────


class MatchedItem(BaseModel):
    requirement: str
    status: str  # "matched" | "partial" | "missing"
    evidence: str


class CVJDMatchResponse(BaseModel):
    id: int
    cv_id: int
    jd_id: int
    match_percentage: float
    match_details: str
    matched_items: list[MatchedItem] = []
    created_at: datetime

    model_config = {"from_attributes": True}

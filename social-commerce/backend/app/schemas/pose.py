"""Pydantic schemas for pose detection API."""

from pydantic import BaseModel, Field
from typing import Optional


class LandmarkSchema(BaseModel):
    """A single pose landmark."""
    x: float = Field(..., ge=0, le=1, description="X coordinate (0-1, left to right)")
    y: float = Field(..., ge=0, le=1, description="Y coordinate (0-1, top to bottom)")
    z: float = Field(..., description="Z coordinate (depth)")
    visibility: float = Field(default=1.0, ge=0, le=1, description="Visibility confidence")


class PoseDetectionRequest(BaseModel):
    """Request body for pose gesture detection."""
    landmarks: list[LandmarkSchema] = Field(
        ...,
        min_length=33,
        max_length=33,
        description="33 MediaPipe pose landmarks"
    )


class GestureResponse(BaseModel):
    """Response from gesture detection."""
    gesture: str = Field(..., description="Detected gesture name")
    confidence: float = Field(..., ge=0, le=1, description="Detection confidence")
    details: dict = Field(default_factory=dict, description="Additional detection details")


class PoseDetectionResponse(BaseModel):
    """API response for pose detection."""
    success: bool = True
    data: GestureResponse
    message: Optional[str] = None

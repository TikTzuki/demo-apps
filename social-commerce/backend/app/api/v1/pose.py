"""Pose detection API endpoints."""

from fastapi import APIRouter, HTTPException
import logging

from app.schemas.pose import (
    PoseDetectionRequest,
    PoseDetectionResponse,
    GestureResponse,
)
from app.services.pose_detection import detect_gesture, Gesture

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/detect", response_model=PoseDetectionResponse)
async def detect_pose_gesture(request: PoseDetectionRequest) -> PoseDetectionResponse:
    """
    Detect gesture from pose landmarks.

    Accepts 33 MediaPipe pose landmarks and returns the detected gesture.

    Supported gestures:
    - hands_up: Both hands raised above shoulders
    - hands_down: Both hands below hips
    - left_hand_up: Only left hand raised
    - right_hand_up: Only right hand raised
    - t_pose: Arms extended horizontally
    - pointing_left: Left arm extended to the side
    - pointing_right: Right arm extended to the side
    - neutral: No specific gesture detected
    """
    try:
        landmarks_dict = [lm.model_dump() for lm in request.landmarks]
        result = detect_gesture(landmarks_dict)

        return PoseDetectionResponse(
            success=True,
            data=GestureResponse(**result),
            message=f"Detected: {result['gesture']}"
        )
    except Exception as e:
        logger.error(f"Pose detection failed: {e}")
        raise HTTPException(status_code=500, detail="Gesture detection failed")


@router.get("/gestures")
async def list_supported_gestures() -> dict:
    """List all supported gestures."""
    return {
        "success": True,
        "data": {
            "gestures": [g.value for g in Gesture],
            "descriptions": {
                Gesture.HANDS_UP.value: "Both hands raised above shoulders",
                Gesture.HANDS_DOWN.value: "Both hands below hips",
                Gesture.LEFT_HAND_UP.value: "Only left hand raised above shoulder",
                Gesture.RIGHT_HAND_UP.value: "Only right hand raised above shoulder",
                Gesture.T_POSE.value: "Arms extended horizontally",
                Gesture.POINTING_LEFT.value: "Left arm extended to the side",
                Gesture.POINTING_RIGHT.value: "Right arm extended to the side",
                Gesture.WAVING.value: "Hand moving side to side (requires sequence)",
                Gesture.ARMS_CROSSED.value: "Arms crossed over chest",
                Gesture.NEUTRAL.value: "No specific gesture detected",
            }
        }
    }

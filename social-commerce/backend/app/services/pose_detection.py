"""
Rule-based pose gesture detection service.

Uses MediaPipe landmark indices for gesture recognition.
This service provides utility functions for detecting gestures
from pose landmark data.
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional


class Gesture(str, Enum):
    """Supported gestures for detection."""
    HANDS_UP = "hands_up"
    HANDS_DOWN = "hands_down"
    LEFT_HAND_UP = "left_hand_up"
    RIGHT_HAND_UP = "right_hand_up"
    ARMS_CROSSED = "arms_crossed"
    T_POSE = "t_pose"
    WAVING = "waving"
    POINTING_LEFT = "pointing_left"
    POINTING_RIGHT = "pointing_right"
    NEUTRAL = "neutral"


# MediaPipe Pose Landmark Indices
class LandmarkIndex:
    """MediaPipe pose landmark indices (33 landmarks total)."""
    NOSE = 0
    LEFT_EYE_INNER = 1
    LEFT_EYE = 2
    LEFT_EYE_OUTER = 3
    RIGHT_EYE_INNER = 4
    RIGHT_EYE = 5
    RIGHT_EYE_OUTER = 6
    LEFT_EAR = 7
    RIGHT_EAR = 8
    MOUTH_LEFT = 9
    MOUTH_RIGHT = 10
    LEFT_SHOULDER = 11
    RIGHT_SHOULDER = 12
    LEFT_ELBOW = 13
    RIGHT_ELBOW = 14
    LEFT_WRIST = 15
    RIGHT_WRIST = 16
    LEFT_PINKY = 17
    RIGHT_PINKY = 18
    LEFT_INDEX = 19
    RIGHT_INDEX = 20
    LEFT_THUMB = 21
    RIGHT_THUMB = 22
    LEFT_HIP = 23
    RIGHT_HIP = 24
    LEFT_KNEE = 25
    RIGHT_KNEE = 26
    LEFT_ANKLE = 27
    RIGHT_ANKLE = 28
    LEFT_HEEL = 29
    RIGHT_HEEL = 30
    LEFT_FOOT_INDEX = 31
    RIGHT_FOOT_INDEX = 32


@dataclass
class Landmark:
    """A single pose landmark with coordinates and visibility."""
    x: float  # Normalized 0-1 (left to right)
    y: float  # Normalized 0-1 (top to bottom)
    z: float  # Depth (smaller = closer to camera)
    visibility: float = 1.0  # Confidence 0-1


@dataclass
class GestureResult:
    """Result of gesture detection."""
    gesture: Gesture
    confidence: float
    details: dict


class PoseGestureDetector:
    """
    Rule-based gesture detector using pose landmarks.

    Detects gestures by analyzing relative positions of body landmarks.
    All coordinates are normalized (0-1) with Y-axis inverted (0 = top).
    """

    def __init__(self, threshold: float = 0.1):
        """
        Initialize detector with position threshold.

        Args:
            threshold: Minimum distance ratio for position comparisons.
        """
        self.threshold = threshold

    def detect(self, landmarks: list[Landmark]) -> GestureResult:
        """
        Detect gesture from pose landmarks.

        Args:
            landmarks: List of 33 MediaPipe pose landmarks.

        Returns:
            GestureResult with detected gesture and confidence.
        """
        if len(landmarks) < 33:
            return GestureResult(
                gesture=Gesture.NEUTRAL,
                confidence=0.0,
                details={"error": "Insufficient landmarks"}
            )

        # Check gestures in order of specificity
        if self._is_hands_up(landmarks):
            return GestureResult(
                gesture=Gesture.HANDS_UP,
                confidence=self._calculate_hands_up_confidence(landmarks),
                details=self._get_arm_positions(landmarks)
            )

        if self._is_t_pose(landmarks):
            return GestureResult(
                gesture=Gesture.T_POSE,
                confidence=self._calculate_t_pose_confidence(landmarks),
                details=self._get_arm_positions(landmarks)
            )

        if self._is_left_hand_up(landmarks):
            return GestureResult(
                gesture=Gesture.LEFT_HAND_UP,
                confidence=0.8,
                details=self._get_arm_positions(landmarks)
            )

        if self._is_right_hand_up(landmarks):
            return GestureResult(
                gesture=Gesture.RIGHT_HAND_UP,
                confidence=0.8,
                details=self._get_arm_positions(landmarks)
            )

        if self._is_pointing_left(landmarks):
            return GestureResult(
                gesture=Gesture.POINTING_LEFT,
                confidence=0.7,
                details=self._get_arm_positions(landmarks)
            )

        if self._is_pointing_right(landmarks):
            return GestureResult(
                gesture=Gesture.POINTING_RIGHT,
                confidence=0.7,
                details=self._get_arm_positions(landmarks)
            )

        if self._is_hands_down(landmarks):
            return GestureResult(
                gesture=Gesture.HANDS_DOWN,
                confidence=0.9,
                details=self._get_arm_positions(landmarks)
            )

        return GestureResult(
            gesture=Gesture.NEUTRAL,
            confidence=0.5,
            details=self._get_arm_positions(landmarks)
        )

    def _is_hands_up(self, landmarks: list[Landmark]) -> bool:
        """Both wrists above shoulders."""
        left_wrist = landmarks[LandmarkIndex.LEFT_WRIST]
        right_wrist = landmarks[LandmarkIndex.RIGHT_WRIST]
        left_shoulder = landmarks[LandmarkIndex.LEFT_SHOULDER]
        right_shoulder = landmarks[LandmarkIndex.RIGHT_SHOULDER]

        # Y is inverted: smaller Y = higher position
        left_up = left_wrist.y < left_shoulder.y - self.threshold
        right_up = right_wrist.y < right_shoulder.y - self.threshold

        return left_up and right_up

    def _is_hands_down(self, landmarks: list[Landmark]) -> bool:
        """Both wrists below hips."""
        left_wrist = landmarks[LandmarkIndex.LEFT_WRIST]
        right_wrist = landmarks[LandmarkIndex.RIGHT_WRIST]
        left_hip = landmarks[LandmarkIndex.LEFT_HIP]
        right_hip = landmarks[LandmarkIndex.RIGHT_HIP]

        left_down = left_wrist.y > left_hip.y + self.threshold
        right_down = right_wrist.y > right_hip.y + self.threshold

        return left_down and right_down

    def _is_left_hand_up(self, landmarks: list[Landmark]) -> bool:
        """Left wrist above left shoulder, right is not."""
        left_wrist = landmarks[LandmarkIndex.LEFT_WRIST]
        right_wrist = landmarks[LandmarkIndex.RIGHT_WRIST]
        left_shoulder = landmarks[LandmarkIndex.LEFT_SHOULDER]
        right_shoulder = landmarks[LandmarkIndex.RIGHT_SHOULDER]

        left_up = left_wrist.y < left_shoulder.y - self.threshold
        right_up = right_wrist.y < right_shoulder.y - self.threshold

        return left_up and not right_up

    def _is_right_hand_up(self, landmarks: list[Landmark]) -> bool:
        """Right wrist above right shoulder, left is not."""
        left_wrist = landmarks[LandmarkIndex.LEFT_WRIST]
        right_wrist = landmarks[LandmarkIndex.RIGHT_WRIST]
        left_shoulder = landmarks[LandmarkIndex.LEFT_SHOULDER]
        right_shoulder = landmarks[LandmarkIndex.RIGHT_SHOULDER]

        left_up = left_wrist.y < left_shoulder.y - self.threshold
        right_up = right_wrist.y < right_shoulder.y - self.threshold

        return right_up and not left_up

    def _is_t_pose(self, landmarks: list[Landmark]) -> bool:
        """Arms extended horizontally (T-pose)."""
        left_wrist = landmarks[LandmarkIndex.LEFT_WRIST]
        right_wrist = landmarks[LandmarkIndex.RIGHT_WRIST]
        left_shoulder = landmarks[LandmarkIndex.LEFT_SHOULDER]
        right_shoulder = landmarks[LandmarkIndex.RIGHT_SHOULDER]
        left_elbow = landmarks[LandmarkIndex.LEFT_ELBOW]
        right_elbow = landmarks[LandmarkIndex.RIGHT_ELBOW]

        # Wrists should be at roughly shoulder height
        left_horizontal = abs(left_wrist.y - left_shoulder.y) < self.threshold * 2
        right_horizontal = abs(right_wrist.y - right_shoulder.y) < self.threshold * 2

        # Wrists should be extended outward from shoulders
        left_extended = left_wrist.x < left_shoulder.x - self.threshold
        right_extended = right_wrist.x > right_shoulder.x + self.threshold

        # Elbows should also be roughly at shoulder height
        left_elbow_horizontal = abs(left_elbow.y - left_shoulder.y) < self.threshold * 2
        right_elbow_horizontal = abs(right_elbow.y - right_shoulder.y) < self.threshold * 2

        return (left_horizontal and right_horizontal and
                left_extended and right_extended and
                left_elbow_horizontal and right_elbow_horizontal)

    def _is_pointing_left(self, landmarks: list[Landmark]) -> bool:
        """Left arm extended to the left side."""
        left_wrist = landmarks[LandmarkIndex.LEFT_WRIST]
        left_shoulder = landmarks[LandmarkIndex.LEFT_SHOULDER]
        left_elbow = landmarks[LandmarkIndex.LEFT_ELBOW]
        right_wrist = landmarks[LandmarkIndex.RIGHT_WRIST]
        right_hip = landmarks[LandmarkIndex.RIGHT_HIP]

        # Left arm extended horizontally
        arm_horizontal = abs(left_wrist.y - left_shoulder.y) < self.threshold * 2
        arm_extended = left_wrist.x < left_shoulder.x - 0.2

        # Right arm is down
        right_down = right_wrist.y > right_hip.y - self.threshold

        return arm_horizontal and arm_extended and right_down

    def _is_pointing_right(self, landmarks: list[Landmark]) -> bool:
        """Right arm extended to the right side."""
        right_wrist = landmarks[LandmarkIndex.RIGHT_WRIST]
        right_shoulder = landmarks[LandmarkIndex.RIGHT_SHOULDER]
        left_wrist = landmarks[LandmarkIndex.LEFT_WRIST]
        left_hip = landmarks[LandmarkIndex.LEFT_HIP]

        # Right arm extended horizontally
        arm_horizontal = abs(right_wrist.y - right_shoulder.y) < self.threshold * 2
        arm_extended = right_wrist.x > right_shoulder.x + 0.2

        # Left arm is down
        left_down = left_wrist.y > left_hip.y - self.threshold

        return arm_horizontal and arm_extended and left_down

    def _calculate_hands_up_confidence(self, landmarks: list[Landmark]) -> float:
        """Calculate confidence for hands up gesture."""
        left_wrist = landmarks[LandmarkIndex.LEFT_WRIST]
        right_wrist = landmarks[LandmarkIndex.RIGHT_WRIST]
        left_shoulder = landmarks[LandmarkIndex.LEFT_SHOULDER]
        right_shoulder = landmarks[LandmarkIndex.RIGHT_SHOULDER]
        nose = landmarks[LandmarkIndex.NOSE]

        # Higher confidence if hands are above head
        left_above_head = left_wrist.y < nose.y
        right_above_head = right_wrist.y < nose.y

        base_confidence = 0.7
        if left_above_head and right_above_head:
            return 0.95
        elif left_above_head or right_above_head:
            return 0.85
        return base_confidence

    def _calculate_t_pose_confidence(self, landmarks: list[Landmark]) -> float:
        """Calculate confidence for T-pose gesture."""
        left_wrist = landmarks[LandmarkIndex.LEFT_WRIST]
        right_wrist = landmarks[LandmarkIndex.RIGHT_WRIST]
        left_shoulder = landmarks[LandmarkIndex.LEFT_SHOULDER]
        right_shoulder = landmarks[LandmarkIndex.RIGHT_SHOULDER]

        # More extended = higher confidence
        shoulder_width = abs(right_shoulder.x - left_shoulder.x)
        arm_span = abs(right_wrist.x - left_wrist.x)

        extension_ratio = arm_span / shoulder_width if shoulder_width > 0 else 0

        # T-pose typically has arm span ~3x shoulder width
        if extension_ratio > 2.5:
            return 0.95
        elif extension_ratio > 2.0:
            return 0.85
        return 0.7

    def _get_arm_positions(self, landmarks: list[Landmark]) -> dict:
        """Get arm position details for debugging."""
        return {
            "left_wrist": {
                "x": landmarks[LandmarkIndex.LEFT_WRIST].x,
                "y": landmarks[LandmarkIndex.LEFT_WRIST].y,
            },
            "right_wrist": {
                "x": landmarks[LandmarkIndex.RIGHT_WRIST].x,
                "y": landmarks[LandmarkIndex.RIGHT_WRIST].y,
            },
            "left_shoulder": {
                "x": landmarks[LandmarkIndex.LEFT_SHOULDER].x,
                "y": landmarks[LandmarkIndex.LEFT_SHOULDER].y,
            },
            "right_shoulder": {
                "x": landmarks[LandmarkIndex.RIGHT_SHOULDER].x,
                "y": landmarks[LandmarkIndex.RIGHT_SHOULDER].y,
            },
        }


# Singleton detector instance
detector = PoseGestureDetector()


def detect_gesture(landmarks: list[dict]) -> dict:
    """
    Detect gesture from raw landmark data.

    Args:
        landmarks: List of 33 landmark dicts with x, y, z, visibility keys.

    Returns:
        Dict with gesture, confidence, and details.
    """
    parsed_landmarks = [
        Landmark(
            x=lm.get("x", 0),
            y=lm.get("y", 0),
            z=lm.get("z", 0),
            visibility=lm.get("visibility", 1.0)
        )
        for lm in landmarks
    ]

    result = detector.detect(parsed_landmarks)

    return {
        "gesture": result.gesture.value,
        "confidence": result.confidence,
        "details": result.details,
    }

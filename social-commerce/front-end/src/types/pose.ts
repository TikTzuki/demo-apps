/**
 * Types for pose detection and gesture recognition.
 */

export type Gesture =
    | 'hands_up'
    | 'hands_down'
    | 'left_hand_up'
    | 'right_hand_up'
    | 'left_hand_down'
    | 'right_hand_down'
    | 't_pose'
    | 'pointing_left'
    | 'pointing_right'
    | 'waving'
    | 'arms_crossed'
    | 'neutral';

export interface Landmark {
    x: number;  // 0-1, left to right
    y: number;  // 0-1, top to bottom
    z: number;  // depth
    visibility: number;  // 0-1 confidence
}

export interface GestureResult {
    gesture: Gesture;
    confidence: number;
    details: Record<string, unknown>;
}

export interface PoseDetectionState {
    isLoading: boolean;
    isDetecting: boolean;
    currentGesture: Gesture | null;
    confidence: number;
    error: string | null;
    landmarks: Landmark[] | null;
}

/**
 * MediaPipe Pose Landmark Indices
 */
export const LANDMARK_INDEX = {
    NOSE: 0,
    LEFT_EYE_INNER: 1,
    LEFT_EYE: 2,
    LEFT_EYE_OUTER: 3,
    RIGHT_EYE_INNER: 4,
    RIGHT_EYE: 5,
    RIGHT_EYE_OUTER: 6,
    LEFT_EAR: 7,
    RIGHT_EAR: 8,
    MOUTH_LEFT: 9,
    MOUTH_RIGHT: 10,
    LEFT_SHOULDER: 11,
    RIGHT_SHOULDER: 12,
    LEFT_ELBOW: 13,
    RIGHT_ELBOW: 14,
    LEFT_WRIST: 15,
    RIGHT_WRIST: 16,
    LEFT_PINKY: 17,
    RIGHT_PINKY: 18,
    LEFT_INDEX: 19,
    RIGHT_INDEX: 20,
    LEFT_THUMB: 21,
    RIGHT_THUMB: 22,
    LEFT_HIP: 23,
    RIGHT_HIP: 24,
    LEFT_KNEE: 25,
    RIGHT_KNEE: 26,
    LEFT_ANKLE: 27,
    RIGHT_ANKLE: 28,
    LEFT_HEEL: 29,
    RIGHT_HEEL: 30,
    LEFT_FOOT_INDEX: 31,
    RIGHT_FOOT_INDEX: 32,
} as const;

/**
 * MediaPipe Pose class interface (attached to window by @mediapipe/pose)
 */
export interface MediaPipePoseResults {
    poseLandmarks?: Array<{
        x: number;
        y: number;
        z: number;
        visibility?: number;
    }>;
}

export interface MediaPipePose {
    setOptions(options: {
        modelComplexity?: number;
        smoothLandmarks?: boolean;
        enableSegmentation?: boolean;
        minDetectionConfidence?: number;
        minTrackingConfidence?: number;
    }): void;

    onResults(callback: (results: MediaPipePoseResults) => void): void;

    send(options: { image: HTMLVideoElement }): Promise<void>;

    close(): Promise<void>;
}

export interface MediaPipePoseConstructor {
    new(config: { locateFile: (file: string) => string }): MediaPipePose;
}
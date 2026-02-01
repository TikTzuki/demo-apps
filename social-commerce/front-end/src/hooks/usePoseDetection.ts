/**
 * React hook for pose detection with MediaPipe and rule-based gesture recognition.
 *
 * Uses MediaPipe Pose for landmark detection and local rule-based logic
 * for gesture classification.
 */

import {useCallback, useEffect, useRef, useState} from 'react';
import type {Gesture, GestureResult, Landmark, MediaPipePose, PoseDetectionState} from '../types/pose';
import {LANDMARK_INDEX} from '../types/pose';

interface UsePoseDetectionOptions {
    /** Detection interval in ms (default: 100) */
    detectionInterval?: number;
    /** Minimum confidence threshold (default: 0.5) */
    minConfidence?: number;
    /** Callback when gesture is detected */
    onGestureDetected?: (result: GestureResult) => void;
    /** Callback when gesture changes */
    onGestureChange?: (newGesture: Gesture, previousGesture: Gesture | null) => void;
}

interface UsePoseDetectionReturn extends PoseDetectionState {
    /** Start pose detection */
    startDetection: (videoElement: HTMLVideoElement) => Promise<void>;
    /** Stop pose detection */
    stopDetection: () => void;
    /** Canvas ref for drawing pose overlay */
    canvasRef: React.RefObject<HTMLCanvasElement>;
}

// Threshold for position comparisons
const POSITION_THRESHOLD = 0.1;

// Store previous wrist positions to detect swipe gestures
let prevLeftWristY: number | null = null;
let prevRightWristY: number | null = null;
const SWIPE_THRESHOLD = 0.15; // Minimum movement to detect swipe

/**
 * Rule-based gesture detection from landmarks.
 * Detects both static poses and dynamic swipe gestures.
 */
function detectGestureFromLandmarks(landmarks: Landmark[]): GestureResult {
    if (landmarks.length < 33) {
        return {gesture: 'neutral', confidence: 0, details: {}};
    }

    const leftWrist = landmarks[LANDMARK_INDEX.LEFT_WRIST];
    const rightWrist = landmarks[LANDMARK_INDEX.RIGHT_WRIST];
    const leftShoulder = landmarks[LANDMARK_INDEX.LEFT_SHOULDER];
    const rightShoulder = landmarks[LANDMARK_INDEX.RIGHT_SHOULDER];
    const leftElbow = landmarks[LANDMARK_INDEX.LEFT_ELBOW];
    const rightElbow = landmarks[LANDMARK_INDEX.RIGHT_ELBOW];
    const leftHip = landmarks[LANDMARK_INDEX.LEFT_HIP];
    const rightHip = landmarks[LANDMARK_INDEX.RIGHT_HIP];
    const nose = landmarks[LANDMARK_INDEX.NOSE];

    // Check hands up (both wrists above shoulders)
    const leftHandUp = leftWrist.y < leftShoulder.y - POSITION_THRESHOLD;
    const rightHandUp = rightWrist.y < rightShoulder.y - POSITION_THRESHOLD;

    if (leftHandUp && rightHandUp) {
        const aboveHead = leftWrist.y < nose.y && rightWrist.y < nose.y;
        return {
            gesture: 'hands_up',
            confidence: aboveHead ? 0.95 : 0.8,
            details: {leftWrist, rightWrist, leftShoulder, rightShoulder},
        };
    }

    // Check T-pose (arms extended horizontally)
    const leftHorizontal = Math.abs(leftWrist.y - leftShoulder.y) < POSITION_THRESHOLD * 2;
    const rightHorizontal = Math.abs(rightWrist.y - rightShoulder.y) < POSITION_THRESHOLD * 2;
    const leftExtended = leftWrist.x < leftShoulder.x - POSITION_THRESHOLD;
    const rightExtended = rightWrist.x > rightShoulder.x + POSITION_THRESHOLD;
    const leftElbowHorizontal = Math.abs(leftElbow.y - leftShoulder.y) < POSITION_THRESHOLD * 2;
    const rightElbowHorizontal = Math.abs(rightElbow.y - rightShoulder.y) < POSITION_THRESHOLD * 2;

    if (leftHorizontal && rightHorizontal && leftExtended && rightExtended &&
        leftElbowHorizontal && rightElbowHorizontal) {
        const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
        const armSpan = Math.abs(rightWrist.x - leftWrist.x);
        const extensionRatio = shoulderWidth > 0 ? armSpan / shoulderWidth : 0;
        return {
            gesture: 't_pose',
            confidence: extensionRatio > 2.5 ? 0.95 : 0.8,
            details: {extensionRatio},
        };
    }

    // Check single hand up
    if (leftHandUp && !rightHandUp) {
        return {
            gesture: 'left_hand_up',
            confidence: 0.8,
            details: {leftWrist, leftShoulder},
        };
    }

    if (rightHandUp && !leftHandUp) {
        return {
            gesture: 'right_hand_up',
            confidence: 0.8,
            details: {rightWrist, rightShoulder},
        };
    }

    // Check pointing left
    const leftArmHorizontal = Math.abs(leftWrist.y - leftShoulder.y) < POSITION_THRESHOLD * 2;
    const leftArmExtended = leftWrist.x < leftShoulder.x - 0.2;
    const rightArmDown = rightWrist.y > rightHip.y - POSITION_THRESHOLD;

    if (leftArmHorizontal && leftArmExtended && rightArmDown) {
        return {
            gesture: 'pointing_left',
            confidence: 0.7,
            details: {leftWrist, leftShoulder},
        };
    }

    // Check pointing right
    const rightArmHorizontal = Math.abs(rightWrist.y - rightShoulder.y) < POSITION_THRESHOLD * 2;
    const rightArmExtended = rightWrist.x > rightShoulder.x + 0.2;
    const leftArmDown = leftWrist.y > leftHip.y - POSITION_THRESHOLD;

    if (rightArmHorizontal && rightArmExtended && leftArmDown) {
        return {
            gesture: 'pointing_right',
            confidence: 0.7,
            details: {rightWrist, rightShoulder},
        };
    }

    // Swipe down detection: hand moves from face/chest level downward
    // Check if hand was near face level and now moved down significantly
    const chestLevel = (leftShoulder.y + rightShoulder.y) / 2;

    // Left hand swipe down: was near face, now below chest
    const leftWasNearFace = prevLeftWristY !== null && prevLeftWristY < chestLevel;
    const leftNowBelow = leftWrist.y > chestLevel + SWIPE_THRESHOLD;
    const leftSwipedDown = leftWasNearFace && leftNowBelow &&
        (leftWrist.y - (prevLeftWristY ?? leftWrist.y)) > SWIPE_THRESHOLD;

    // Right hand swipe down: was near face, now below chest
    const rightWasNearFace = prevRightWristY !== null && prevRightWristY < chestLevel;
    const rightNowBelow = rightWrist.y > chestLevel + SWIPE_THRESHOLD;
    const rightSwipedDown = rightWasNearFace && rightNowBelow &&
        (rightWrist.y - (prevRightWristY ?? rightWrist.y)) > SWIPE_THRESHOLD;

    // Update previous positions for next frame
    prevLeftWristY = leftWrist.y;
    prevRightWristY = rightWrist.y;

    // Both hands swiped down
    if (leftSwipedDown && rightSwipedDown) {
        return {
            gesture: 'hands_down',
            confidence: 0.9,
            details: {leftWrist, rightWrist, movement: 'swipe_down'},
        };
    }

    // Single hand swipe down
    if (leftSwipedDown) {
        return {
            gesture: 'left_hand_down',
            confidence: 0.85,
            details: {leftWrist, movement: 'swipe_down'},
        };
    }

    if (rightSwipedDown) {
        return {
            gesture: 'right_hand_down',
            confidence: 0.85,
            details: {rightWrist, movement: 'swipe_down'},
        };
    }

    return {
        gesture: 'neutral',
        confidence: 0.5,
        details: {},
    };
}

/**
 * Draw pose landmarks on canvas.
 */
function drawPose(
    ctx: CanvasRenderingContext2D,
    landmarks: Landmark[],
    width: number,
    height: number
): void {
    ctx.clearRect(0, 0, width, height);

    // Draw connections
    const connections = [
        [11, 12], // shoulders
        [11, 13], [13, 15], // left arm
        [12, 14], [14, 16], // right arm
        [11, 23], [12, 24], // torso
        [23, 24], // hips
        [23, 25], [25, 27], // left leg
        [24, 26], [26, 28], // right leg
    ];

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;

    for (const [start, end] of connections) {
        const startLm = landmarks[start];
        const endLm = landmarks[end];
        if (startLm && endLm && startLm.visibility > 0.5 && endLm.visibility > 0.5) {
            ctx.beginPath();
            ctx.moveTo(startLm.x * width, startLm.y * height);
            ctx.lineTo(endLm.x * width, endLm.y * height);
            ctx.stroke();
        }
    }

    // Draw landmarks
    ctx.fillStyle = '#ff0000';
    for (const landmark of landmarks) {
        if (landmark.visibility > 0.5) {
            ctx.beginPath();
            ctx.arc(landmark.x * width, landmark.y * height, 5, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}

export function usePoseDetection(options: UsePoseDetectionOptions = {}): UsePoseDetectionReturn {
    const {
        detectionInterval = 100,
        minConfidence = 0.5,
        onGestureDetected,
        onGestureChange,
    } = options;

    const [state, setState] = useState<PoseDetectionState>({
        isLoading: false,
        isDetecting: false,
        currentGesture: null,
        confidence: 0,
        error: null,
        landmarks: null,
    });

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const poseRef = useRef<MediaPipePose | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const lastGestureRef = useRef<Gesture | null>(null);

    // Use refs to always have latest callbacks (avoids stale closure issues)
    const onGestureDetectedRef = useRef(onGestureDetected);
    const onGestureChangeRef = useRef(onGestureChange);

    useEffect(() => {
        onGestureDetectedRef.current = onGestureDetected;
        onGestureChangeRef.current = onGestureChange;
    }, [onGestureDetected, onGestureChange]);

    const stopDetection = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        setState(prev => ({...prev, isDetecting: false}));
    }, []);

    const startDetection = useCallback(async (videoElement: HTMLVideoElement) => {
        console.log("[PoseDetection] Starting detection, setting isLoading: true");
        setState(prev => ({...prev, isLoading: true, error: null}));

        try {
            // Dynamically import MediaPipe - it attaches Pose to the global window object
            const {Pose} = await import('@mediapipe/pose');
            // const Pose = (window as unknown as { Pose: MediaPipePoseConstructor }).Pose;

            // const pose = new Pose({
            //   locateFile: (file: string) =>
            //     `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
            // });
            const pose = new Pose({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
                },
            });

            pose.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                enableSegmentation: false,
                minDetectionConfidence: minConfidence,
                minTrackingConfidence: minConfidence,
            });

            pose.onResults((results) => {
                if (!results.poseLandmarks) return;

                const landmarks: Landmark[] = results.poseLandmarks.map(lm => ({
                    x: lm.x,
                    y: lm.y,
                    z: lm.z,
                    visibility: lm.visibility ?? 1.0,
                }));

                // Detect gesture
                const gestureResult = detectGestureFromLandmarks(landmarks);

                // Draw pose on canvas
                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        drawPose(ctx, landmarks, canvasRef.current.width, canvasRef.current.height);
                    }
                }

                // Update state
                setState(prev => ({
                    ...prev,
                    landmarks,
                    currentGesture: gestureResult.gesture,
                    confidence: gestureResult.confidence,
                }));

                // Callbacks - use refs for latest callbacks
                onGestureDetectedRef.current?.(gestureResult);

                if (gestureResult.gesture !== lastGestureRef.current) {
                    console.log("[PoseDetection] Gesture changed:", lastGestureRef.current, "->", gestureResult.gesture);
                    onGestureChangeRef.current?.(gestureResult.gesture, lastGestureRef.current);
                    lastGestureRef.current = gestureResult.gesture;
                }
            });

            poseRef.current = pose;
            console.log("[PoseDetection] Detection started, setting isLoading: false, isDetecting: true");
            setState(prev => ({...prev, isLoading: false, isDetecting: true}));

            // Detection loop
            let lastDetectionTime = 0;

            const detect = async (timestamp: number) => {
                if (!poseRef.current) return;

                if (timestamp - lastDetectionTime >= detectionInterval) {
                    try {
                        await poseRef.current.send({image: videoElement});
                        lastDetectionTime = timestamp;
                    } catch (err) {
                        console.error('Pose detection error:', err);
                    }
                }

                animationFrameRef.current = requestAnimationFrame(detect);
            };

            animationFrameRef.current = requestAnimationFrame(detect);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to initialize pose detection';
            console.error('[PoseDetection] Initialization failed:', error);
            setState(prev => ({...prev, isLoading: false, error: message}));
        }
    }, [detectionInterval, minConfidence, onGestureDetected, onGestureChange]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopDetection();
        };
    }, [stopDetection]);

    return {
        ...state,
        startDetection,
        stopDetection,
        canvasRef,
    };
}
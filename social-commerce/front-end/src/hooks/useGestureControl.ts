import {useCallback, useRef, useState, useEffect} from "react";
import {usePoseDetection} from "./usePoseDetection";
import type {Gesture} from "@/types/pose";

type CameraPermission = "prompt" | "granted" | "denied";

interface UseGestureControlOptions {
    /** Cooldown between scroll actions in ms (default: 1000) */
    cooldownMs?: number;
    /** Callback when scroll up is triggered */
    onScrollUp?: () => void;
    /** Callback when scroll down is triggered */
    onScrollDown?: () => void;
    /** Whether gesture control is enabled */
    enabled?: boolean;
}

interface UseGestureControlReturn {
    /** Camera permission status */
    cameraPermission: CameraPermission;
    /** Whether pose detection is active */
    isActive: boolean;
    /** Whether pose detection is loading */
    isLoading: boolean;
    /** Current detected gesture */
    currentGesture: Gesture | null;
    /** Error message if any */
    error: string | null;
    /** Request camera permission and start detection */
    requestCameraAccess: () => Promise<void>;
    /** Stop detection */
    stopDetection: () => void;
    /** Video element ref to attach to hidden video */
    videoRef: React.RefObject<HTMLVideoElement>;
}

// Gestures that trigger scroll down (next feed) - hand up = scroll to next
const SCROLL_DOWN_GESTURES: Gesture[] = ["left_hand_up", "right_hand_up"];

// Human-readable action labels for gestures
export const GESTURE_LABELS: Record<Gesture, string> = {
    hands_up: "",
    left_hand_up: "Next",
    right_hand_up: "Next",
    hands_down: "",
    left_hand_down: "",
    right_hand_down: "",
    t_pose: "",
    pointing_left: "",
    pointing_right: "",
    waving: "",
    arms_crossed: "",
    neutral: "",
};

export function useGestureControl(
    options: UseGestureControlOptions = {}
): UseGestureControlReturn {
    const {
        cooldownMs = 1000,
        onScrollUp,
        onScrollDown,
        enabled = true,
    } = options;

    const [cameraPermission, setCameraPermission] = useState<CameraPermission>("prompt");
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const lastScrollTimeRef = useRef<number>(0);
    const streamRef = useRef<MediaStream | null>(null);

    // Use refs to always have latest callbacks
    const onScrollUpRef = useRef(onScrollUp);
    const onScrollDownRef = useRef(onScrollDown);
    const enabledRef = useRef(enabled);
    const cooldownMsRef = useRef(cooldownMs);

    // Keep refs updated
    useEffect(() => {
        onScrollUpRef.current = onScrollUp;
        onScrollDownRef.current = onScrollDown;
        enabledRef.current = enabled;
        cooldownMsRef.current = cooldownMs;
    }, [onScrollUp, onScrollDown, enabled, cooldownMs]);

    const handleGestureChange = useCallback(
        (newGesture: Gesture, _previousGesture: Gesture | null) => {
            if (!enabledRef.current) return;

            const now = Date.now();
            const timeSinceLastScroll = now - lastScrollTimeRef.current;

            // Check cooldown
            if (timeSinceLastScroll < cooldownMsRef.current) return;

            // Check for scroll down gestures (hand up = next feed)
            if (SCROLL_DOWN_GESTURES.includes(newGesture)) {
                console.log("[GestureControl] Scroll DOWN (next) triggered:", newGesture);
                lastScrollTimeRef.current = now;
                onScrollDownRef.current?.();
                return;
            }
        },
        [] // No dependencies - uses refs for latest values
    );

    const {
        isLoading,
        isDetecting,
        currentGesture,
        error,
        startDetection,
        stopDetection: stopPoseDetection,
    } = usePoseDetection({
        detectionInterval: 100,
        onGestureChange: handleGestureChange,
    });

    // Debug: log state changes
    useEffect(() => {
        console.log("[GestureControl] State:", {isLoading, isDetecting, stream: !!stream});
    }, [isLoading, isDetecting, stream]);

    const stopDetection = useCallback(() => {
        stopPoseDetection();
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
            setStream(null);
        }
    }, [stopPoseDetection]);

    const requestCameraAccess = useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: {ideal: 640},
                    height: {ideal: 480},
                    facingMode: "user",
                },
            });

            streamRef.current = mediaStream;
            setStream(mediaStream);
            setCameraPermission("granted");

            // Wait for video element to be ready
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                await videoRef.current.play();
                await startDetection(videoRef.current);
            }
        } catch (err) {
            console.error("Camera access denied:", err);
            setCameraPermission("denied");
        }
    }, [startDetection]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    // Stop detection when disabled
    useEffect(() => {
        if (!enabled && isDetecting) {
            stopDetection();
        }
    }, [enabled, isDetecting, stopDetection]);

    return {
        cameraPermission,
        isActive: isDetecting && !!stream,
        isLoading,
        currentGesture,
        error,
        requestCameraAccess,
        stopDetection,
        videoRef,
    };
}

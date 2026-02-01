/**
 * PoseDetector component for webcam-based gesture recognition.
 *
 * Uses MediaPipe Pose for landmark detection and rule-based gesture classification.
 */

import {useCallback, useEffect, useRef, useState} from 'react';
import {usePoseDetection} from '../../hooks/usePoseDetection';
import type {Gesture, GestureResult} from '../../types/pose';

interface PoseDetectorProps {
    /** Callback when gesture is detected */
    onGestureDetected?: (result: GestureResult) => void;
    /** Callback when gesture changes */
    onGestureChange?: (newGesture: Gesture, previousGesture: Gesture | null) => void;
    /** Show pose overlay on video */
    showOverlay?: boolean;
    /** Show gesture label */
    showLabel?: boolean;
    /** Custom className for container */
    className?: string;
    /** Video dimensions */
    width?: number;
    height?: number;
}

const GESTURE_LABELS: Record<Gesture, string> = {
    hands_up: '🙌 Hands Up!',
    hands_down: '👇 Hands Down',
    left_hand_up: '🤚 Left Hand Up',
    right_hand_up: '✋ Right Hand Up',
    left_hand_down: '👇 Left Hand Down',
    right_hand_down: '👇 Right Hand Down',
    t_pose: '✈️ T-Pose',
    pointing_left: '👈 Pointing Left',
    pointing_right: '👉 Pointing Right',
    waving: '👋 Waving',
    arms_crossed: '🤞 Arms Crossed',
    neutral: '😐 Neutral',
};

const GESTURE_COLORS: Record<Gesture, string> = {
    hands_up: 'bg-green-500',
    hands_down: 'bg-blue-500',
    left_hand_up: 'bg-yellow-500',
    right_hand_up: 'bg-yellow-500',
    left_hand_down: 'bg-blue-400',
    right_hand_down: 'bg-blue-400',
    t_pose: 'bg-purple-500',
    pointing_left: 'bg-orange-500',
    pointing_right: 'bg-orange-500',
    waving: 'bg-pink-500',
    arms_crossed: 'bg-red-500',
    neutral: 'bg-gray-500',
};

export function PoseDetector({
                                 onGestureDetected,
                                 onGestureChange,
                                 showOverlay = true,
                                 showLabel = true,
                                 className = '',
                                 width = 640,
                                 height = 480,
                             }: PoseDetectorProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    const {
        isLoading,
        isDetecting,
        currentGesture,
        confidence,
        error,
        startDetection,
        stopDetection,
        canvasRef,
    } = usePoseDetection({
        onGestureDetected,
        onGestureChange,
        detectionInterval: 100,
        minConfidence: 0.5,
    });

    // Initialize camera
    const initCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: {ideal: width},
                    height: {ideal: height},
                    facingMode: 'user',
                },
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setIsCameraReady(true);
                setCameraError(null);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to access camera';
            setCameraError(message);
            setIsCameraReady(false);
        }
    }, [width, height]);

    // Start detection when camera is ready
    useEffect(() => {
        if (isCameraReady && videoRef.current && !isDetecting) {
            startDetection(videoRef.current);
        }
    }, [isCameraReady, isDetecting, startDetection]);

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            if (videoRef.current?.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
            }
            stopDetection();
        };
    }, [stopDetection]);

    const handleStart = () => {
        initCamera();
    };

    const handleStop = () => {
        if (videoRef.current?.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraReady(false);
        stopDetection();
    };

    return (
        <div className={`relative ${className}`}>
            {/* Video container */}
            <div
                className="relative bg-black rounded-lg overflow-hidden"
                style={{width, height}}
            >
                <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    playsInline
                    muted
                    style={{transform: 'scaleX(-1)'}} // Mirror video
                />

                {/* Pose overlay canvas */}
                {showOverlay && (
                    <canvas
                        ref={canvasRef}
                        width={width}
                        height={height}
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        style={{transform: 'scaleX(-1)'}} // Mirror overlay
                    />
                )}

                {/* Gesture label */}
                {showLabel && currentGesture && isDetecting && (
                    <div
                        className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-white font-semibold text-lg shadow-lg transition-all ${GESTURE_COLORS[currentGesture]}`}
                    >
                        {GESTURE_LABELS[currentGesture]}
                        <span className="ml-2 text-sm opacity-75">
              {Math.round(confidence * 100)}%
            </span>
                    </div>
                )}

                {/* Loading overlay */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="text-white text-center">
                            <div
                                className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-2"/>
                            <p>Loading pose detection...</p>
                        </div>
                    </div>
                )}

                {/* Camera not started */}
                {!isCameraReady && !isLoading && !cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                        <button
                            onClick={handleStart}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                        >
                            📷 Start Camera
                        </button>
                    </div>
                )}

                {/* Error state */}
                {(error || cameraError) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-900/80">
                        <div className="text-white text-center p-4">
                            <p className="text-red-200 mb-2">⚠️ Error</p>
                            <p className="text-sm">{error || cameraError}</p>
                            <button
                                onClick={handleStart}
                                className="mt-4 px-4 py-2 bg-white text-red-900 rounded hover:bg-gray-100"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="mt-4 flex justify-center gap-4">
                {!isCameraReady ? (
                    <button
                        onClick={handleStart}
                        disabled={isLoading}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                    >
                        {isLoading ? 'Starting...' : 'Start Detection'}
                    </button>
                ) : (
                    <button
                        onClick={handleStop}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Stop Detection
                    </button>
                )}
            </div>

            {/* Status */}
            <div className="mt-2 text-center text-sm text-gray-600">
                {isDetecting ? (
                    <span className="text-green-600">● Detecting gestures...</span>
                ) : isCameraReady ? (
                    <span className="text-yellow-600">● Camera ready</span>
                ) : (
                    <span className="text-gray-400">○ Camera off</span>
                )}
            </div>
        </div>
    );
}
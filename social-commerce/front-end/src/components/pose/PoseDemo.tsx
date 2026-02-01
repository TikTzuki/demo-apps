/**
 * Demo page for testing pose detection and gesture recognition.
 */

import {useState} from 'react';
import {PoseDetector} from './PoseDetector';
import type {Gesture, GestureResult} from '../../types/pose';

interface GestureLog {
    timestamp: Date;
    gesture: Gesture;
    confidence: number;
}

export function PoseDemo() {
    const [gestureHistory, setGestureHistory] = useState<GestureLog[]>([]);
    const [lastGesture, setLastGesture] = useState<Gesture | null>(null);

    const handleGestureChange = (newGesture: Gesture, _previousGesture: Gesture | null) => {
        if (newGesture !== 'neutral') {
            setGestureHistory(prev => [
                {timestamp: new Date(), gesture: newGesture, confidence: 0},
                ...prev.slice(0, 9), // Keep last 10
            ]);
        }
        setLastGesture(newGesture);
    };

    const handleGestureDetected = (result: GestureResult) => {
        // Update the confidence of the last logged gesture
        if (result.gesture !== 'neutral') {
            setGestureHistory(prev => {
                if (prev.length > 0 && prev[0].gesture === result.gesture) {
                    return [{...prev[0], confidence: result.confidence}, ...prev.slice(1)];
                }
                return prev;
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
                    🎯 Pose Gesture Detection
                </h1>
                <p className="text-gray-600 text-center mb-8">
                    Stand in front of your camera and try different poses!
                </p>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Camera view */}
                    <div className="flex flex-col items-center">
                        <PoseDetector
                            onGestureDetected={handleGestureDetected}
                            onGestureChange={handleGestureChange}
                            showOverlay={true}
                            showLabel={true}
                            width={480}
                            height={360}
                        />
                    </div>

                    {/* Instructions and history */}
                    <div className="space-y-6">
                        {/* Supported gestures */}
                        <div className="bg-white rounded-lg p-4 shadow">
                            <h2 className="font-semibold text-gray-800 mb-3">
                                Supported Gestures
                            </h2>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-center gap-2">
                                    <span
                                        className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">🙌</span>
                                    <span><strong>Hands Up</strong> - Raise both hands above shoulders</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span
                                        className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">✈️</span>
                                    <span><strong>T-Pose</strong> - Extend arms horizontally</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span
                                        className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs">✋</span>
                                    <span><strong>One Hand Up</strong> - Raise one hand</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span
                                        className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs">👉</span>
                                    <span><strong>Pointing</strong> - Extend one arm to the side</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span
                                        className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">👇</span>
                                    <span><strong>Hands Down</strong> - Lower both hands below hips</span>
                                </li>
                            </ul>
                        </div>

                        {/* Gesture history */}
                        <div className="bg-white rounded-lg p-4 shadow">
                            <h2 className="font-semibold text-gray-800 mb-3">
                                Recent Gestures
                            </h2>
                            {gestureHistory.length === 0 ? (
                                <p className="text-gray-400 text-sm text-center py-4">
                                    No gestures detected yet. Try raising your hands!
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {gestureHistory.map((log, index) => (
                                        <li
                                            key={`${log.timestamp.getTime()}-${index}`}
                                            className="flex items-center justify-between text-sm"
                                        >
                      <span className="font-medium capitalize">
                        {log.gesture.replace('_', ' ')}
                      </span>
                                            <span className="text-gray-400">
                        {log.confidence > 0 && `${Math.round(log.confidence * 100)}% • `}
                                                {log.timestamp.toLocaleTimeString()}
                      </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Current state */}
                        <div className="bg-white rounded-lg p-4 shadow">
                            <h2 className="font-semibold text-gray-800 mb-2">
                                Current State
                            </h2>
                            <div className="text-2xl font-bold text-center py-4 capitalize">
                                {lastGesture ? lastGesture.replace('_', ' ') : 'Waiting...'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
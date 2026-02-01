import {motion, AnimatePresence} from "motion/react";
import {Camera, CameraOff, ArrowUp, ArrowDown} from "lucide-react";

import type {Gesture} from "@/types/pose";
import {GESTURE_LABELS} from "@/hooks/useGestureControl";

type CameraPermission = "prompt" | "granted" | "denied";

interface PoseIndicatorProps {
    /** Camera permission status */
    permission: CameraPermission;
    /** Whether pose detection is actively running */
    isActive: boolean;
    /** Whether pose detection is loading */
    isLoading: boolean;
    /** Current detected gesture */
    currentGesture?: Gesture | null;
    /** Callback when user clicks to enable camera */
    onEnableClick?: () => void;
}

export default function PoseIndicator({
                                          permission,
                                          isActive,
                                          isLoading,
                                          currentGesture,
                                          onEnableClick,
                                      }: PoseIndicatorProps) {
    // Don't show anything if permission hasn't been requested
    if (permission === "prompt") {
        return (
            <motion.button
                initial={{opacity: 0, scale: 0.8}}
                animate={{opacity: 1, scale: 1}}
                exit={{opacity: 0, scale: 0.8}}
                onClick={onEnableClick}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
                title="Enable gesture control"
            >
                <Camera className="w-4 h-4 text-white"/>
                <span className="text-xs text-white/80">Gestures</span>
            </motion.button>
        );
    }

    // Permission denied
    if (permission === "denied") {
        return (
            <motion.div
                initial={{opacity: 0, scale: 0.8}}
                animate={{opacity: 1, scale: 1}}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/30 backdrop-blur-sm"
                title="Camera permission denied"
            >
                <CameraOff className="w-4 h-4 text-red-300"/>
                <span className="text-xs text-red-200">Denied</span>
            </motion.div>
        );
    }

    // Get action label for current gesture
    const actionLabel = currentGesture ? GESTURE_LABELS[currentGesture] : "";
    const isScrollUp = actionLabel === "Scroll Up";
    const isScrollDown = actionLabel === "Scroll Down";

    // Permission granted - show status with action label
    return (
        <div className="flex flex-col items-start gap-1">
            <AnimatePresence mode="wait">
                <motion.div
                    key={isActive ? "active" : isLoading ? "loading" : "paused"}
                    initial={{opacity: 0, scale: 0.8}}
                    animate={{opacity: 1, scale: 1}}
                    exit={{opacity: 0, scale: 0.8}}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm"
                    title={isActive ? "Gesture control active" : isLoading ? "Loading..." : "Gesture control paused"}
                >
                    <Camera className="w-4 h-4 text-white"/>
                    <motion.div
                        className={`w-2 h-2 rounded-full ${
                            isActive
                                ? "bg-green-400"
                                : isLoading
                                    ? "bg-yellow-400"
                                    : "bg-gray-400"
                        }`}
                        animate={
                            isActive
                                ? {scale: [1, 1.2, 1], opacity: [1, 0.8, 1]}
                                : isLoading
                                    ? {scale: [1, 1.1, 1]}
                                    : undefined
                        }
                        transition={
                            isActive || isLoading
                                ? {repeat: Infinity, duration: isActive ? 2 : 0.8}
                                : undefined
                        }
                    />
                </motion.div>
            </AnimatePresence>

            {/* Action label - shows current gesture action */}
            <AnimatePresence>
                {isActive && actionLabel && (
                    <motion.div
                        initial={{opacity: 0, x: -10}}
                        animate={{opacity: 1, x: 0}}
                        exit={{opacity: 0, x: -10}}
                        transition={{duration: 0.15}}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            isScrollUp
                                ? "bg-blue-500/80 text-white"
                                : isScrollDown
                                    ? "bg-orange-500/80 text-white"
                                    : "bg-white/20 text-white/80"
                        }`}
                    >
                        {isScrollUp && <ArrowUp className="w-3 h-3"/>}
                        {isScrollDown && <ArrowDown className="w-3 h-3"/>}
                        <span>{actionLabel}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

import {useState, useCallback, useRef, useEffect} from "react";
import {motion, AnimatePresence} from "motion/react";

import {useSpeechToText} from "@/hooks/useSpeechToText";

interface VoiceCommentButtonProps {
    onComment: (text: string) => Promise<void>;
    disabled?: boolean;
}

export default function VoiceCommentButton({
                                               onComment,
                                               disabled = false,
                                           }: VoiceCommentButtonProps) {
    const [isHolding, setIsHolding] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const {
        transcript,
        interimTranscript,
        startListening,
        stopListening,
        resetTranscript,
        error,
    } = useSpeechToText();

    const handleStart = useCallback(() => {
        if (disabled || isSending) return;

        // Small delay to confirm hold intent
        holdTimeoutRef.current = setTimeout(() => {
            setIsHolding(true);
            resetTranscript();
            startListening();
        }, 150);
    }, [disabled, isSending, resetTranscript, startListening]);

    const handleEnd = useCallback(async () => {
        if (holdTimeoutRef.current) {
            clearTimeout(holdTimeoutRef.current);
            holdTimeoutRef.current = null;
        }

        if (!isHolding) return;

        setIsHolding(false);
        stopListening();

        // Wait a bit for final transcript
        await new Promise((resolve) => setTimeout(resolve, 300));

        const finalText = transcript.trim();
        if (finalText) {
            setIsSending(true);
            try {
                await onComment(finalText);
            } finally {
                setIsSending(false);
                resetTranscript();
            }
        }
    }, [isHolding, stopListening, transcript, onComment, resetTranscript]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (holdTimeoutRef.current) {
                clearTimeout(holdTimeoutRef.current);
            }
        };
    }, []);

    const displayText = interimTranscript || transcript;

    return (
        <div className="flex flex-col items-center gap-3">
            {/* Transcript display */}
            <AnimatePresence>
                {(isHolding || displayText) && (
                    <motion.div
                        initial={{opacity: 0, y: 10}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: 10}}
                        className="bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-2 max-w-[80vw] shadow-lg"
                    >
                        <p className="text-gray-800 text-sm">
                            {displayText || (
                                <span className="text-gray-400 italic">Đang lắng nghe...</span>
                            )}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error display */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        className="bg-red-500/90 text-white text-xs px-3 py-1 rounded-full"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mic button */}
            <motion.button
                onMouseDown={handleStart}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchEnd={handleEnd}
                disabled={disabled || isSending}
                className={`
          relative w-14 h-14 rounded-full flex items-center justify-center
          transition-colors select-none touch-none
          ${isHolding ? "bg-red-500" : "bg-white/20 backdrop-blur-sm"}
          ${disabled || isSending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
                whileHover={{scale: disabled ? 1 : 1.05}}
                whileTap={{scale: disabled ? 1 : 0.95}}
                animate={isHolding ? {scale: [1, 1.1, 1]} : {}}
                transition={isHolding ? {repeat: Infinity, duration: 1} : {}}
            >
                {/* Mic icon */}
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" x2="12" y1="19" y2="22"/>
                </svg>

                {/* Recording indicator ring */}
                {isHolding && (
                    <motion.div
                        className="absolute inset-0 rounded-full border-4 border-white/50"
                        animate={{scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8]}}
                        transition={{repeat: Infinity, duration: 1.5}}
                    />
                )}

                {/* Sending spinner */}
                {isSending && (
                    <motion.div
                        className="absolute inset-0 rounded-full border-2 border-white/30 border-t-white"
                        animate={{rotate: 360}}
                        transition={{repeat: Infinity, duration: 1, ease: "linear"}}
                    />
                )}
            </motion.button>

            {/* Hint text */}
            <p className="text-white/70 text-xs">
                {isSending ? "Đang gửi..." : isHolding ? "Đang ghi âm..." : "Giữ để bình luận"}
            </p>
        </div>
    );
}

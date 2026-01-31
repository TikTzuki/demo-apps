import {motion, AnimatePresence} from "motion/react";
import {useCallback, useState} from "react";

import type {Mood} from "@/types/feed";
import {
    type DogId,
    getDogImagePath,
    DOG_CONFIGS,
    getNextDogId,
} from "@/config/dogs";

interface CuteFaceProps {
    mood?: Mood;
    backgroundColor?: string;
    size?: number;
    dogId?: DogId;
    onDogChange?: (dogId: DogId) => void;
}

const DOUBLE_TAP_DELAY = 300; // ms

export default function CuteFace({
                                     mood = "happy",
                                     backgroundColor = "#f6c400",
                                     size = 300,
                                     dogId = 5,
                                     onDogChange,
                                 }: CuteFaceProps) {
    const [lastTapTime, setLastTapTime] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const imagePath = getDogImagePath(dogId, mood);
    const dogName = DOG_CONFIGS[dogId].name;

    const handleTap = useCallback(() => {
        const now = Date.now();
        const timeSinceLastTap = now - lastTapTime;

        if (timeSinceLastTap < DOUBLE_TAP_DELAY && timeSinceLastTap > 0) {
            // Double tap detected
            const nextDogId = getNextDogId(dogId);
            setIsTransitioning(true);

            // Trigger transition animation
            setTimeout(() => {
                onDogChange?.(nextDogId);
                setIsTransitioning(false);
            }, 150);

            setLastTapTime(0);
        } else {
            setLastTapTime(now);
        }
    }, [lastTapTime, dogId, onDogChange]);

    return (
        <div
            onClick={handleTap}
            style={{
                width: "100%",
                height: "100%",
                background: `linear-gradient(180deg, ${backgroundColor}, ${lightenColor(backgroundColor, 20)})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                userSelect: "none",
            }}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${dogId}-${mood}`}
                    initial={{scale: 0.8, opacity: 0}}
                    animate={{
                        scale: isTransitioning ? 0.9 : 1,
                        opacity: isTransitioning ? 0.5 : 1,
                    }}
                    exit={{scale: 0.8, opacity: 0}}
                    transition={{duration: 0.2, ease: "easeOut"}}
                    style={{
                        width: size,
                        height: size,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <motion.img
                        src={imagePath}
                        alt={`${dogName} - ${mood}`}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                        }}
                        animate={{
                            y: mood === "excited" ? [0, -10, 0] : 0,
                        }}
                        transition={
                            mood === "excited"
                                ? {repeat: Infinity, duration: 0.5, ease: "easeInOut"}
                                : undefined
                        }
                        draggable={false}
                    />
                </motion.div>
            </AnimatePresence>

            {/* Dog indicator - shows which dog is active */}
            <motion.div
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                style={{
                    position: "absolute",
                    bottom: "45%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: "4px",
                }}
            >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((id) => (
                    <div
                        key={id}
                        style={{
                            width: id === dogId ? "8px" : "6px",
                            height: id === dogId ? "8px" : "6px",
                            borderRadius: "50%",
                            backgroundColor: id === dogId ? "white" : "rgba(255,255,255,0.4)",
                            transition: "all 0.2s ease",
                        }}
                    />
                ))}
            </motion.div>

            {/* Double tap hint - shows briefly */}
            <motion.div
                initial={{opacity: 0.7}}
                animate={{opacity: 0}}
                transition={{delay: 2, duration: 1}}
                style={{
                    position: "absolute",
                    bottom: "40%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "12px",
                    whiteSpace: "nowrap",
                }}
            >
                Double tap to switch pet
            </motion.div>
        </div>
    );
}

function lightenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, (num >> 16) + Math.round(2.55 * percent));
    const g = Math.min(255, ((num >> 8) & 0x00ff) + Math.round(2.55 * percent));
    const b = Math.min(255, (num & 0x0000ff) + Math.round(2.55 * percent));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

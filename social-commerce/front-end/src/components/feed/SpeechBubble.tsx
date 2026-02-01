import {motion, AnimatePresence} from "motion/react";

interface SpeechBubbleProps {
    text: string;
    isVisible: boolean;
    isSpeaking: boolean;
}

export default function SpeechBubble({text, isVisible, isSpeaking}: SpeechBubbleProps) {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{opacity: 0, scale: 0.8, y: 20}}
                    animate={{opacity: 1, scale: 1, y: 0}}
                    exit={{opacity: 0, scale: 0.8, y: 20}}
                    transition={{type: "spring", stiffness: 300, damping: 25}}
                    className="absolute top-[15%] left-1/2 -translate-x-1/2 z-10"
                >
                    <div className="relative bg-white rounded-3xl px-6 py-4 max-w-[80vw] shadow-xl">
                        <motion.p
                            className="text-gray-800 text-lg font-medium text-center"
                            animate={isSpeaking ? {opacity: [1, 0.7, 1]} : {opacity: 1}}
                            transition={isSpeaking ? {repeat: Infinity, duration: 0.8} : undefined}
                        >
                            {text}
                        </motion.p>

                        {/* Speech bubble tail */}
                        <div
                            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0"
                            style={{
                                borderLeft: "12px solid transparent",
                                borderRight: "12px solid transparent",
                                borderTop: "16px solid white",
                            }}
                        />
                    </div>

                    {/* Speaking indicator dots */}
                    {isSpeaking && (
                        <div className="flex justify-center gap-1.5 mt-5">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    className="w-2 h-2 bg-white rounded-full"
                                    animate={{y: [0, -8, 0]}}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 0.6,
                                        delay: i * 0.15,
                                        ease: "easeInOut",
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

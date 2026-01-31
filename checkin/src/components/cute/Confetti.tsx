"use client";

import {useEffect} from "react";
import confetti from "canvas-confetti";

interface ConfettiProps {
    trigger?: boolean;
}

export function Confetti({trigger = true}: ConfettiProps) {
    useEffect(() => {
        if (!trigger) return;

        const duration = 3000;
        const end = Date.now() + duration;

        const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD"];

        const frame = () => {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: {x: 0},
                colors,
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: {x: 1},
                colors,
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };

        frame();

        // Big burst at the start
        confetti({
            particleCount: 100,
            spread: 100,
            origin: {y: 0.6},
            colors,
        });
    }, [trigger]);

    return null;
}

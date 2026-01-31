"use client";

import {cn} from "@/lib/utils";

interface CuteFaceProps {
    size?: "sm" | "md" | "lg";
    expression?: "happy" | "excited" | "wink";
    className?: string;
}

export function CuteFace({
                             size = "md",
                             expression = "happy",
                             className,
                         }: CuteFaceProps) {
    const sizeClasses = {
        sm: "text-2xl",
        md: "text-4xl",
        lg: "text-6xl",
    };

    const faces = {
        happy: "(◕‿◕)",
        excited: "(◕ᴗ◕✿)",
        wink: "(◕‿◕✿)",
    };

    return (
        <div className={cn("select-none", sizeClasses[size], className)}>
            <span className="inline-block animate-bounce">{faces[expression]}</span>
        </div>
    );
}

"use client";

import {useEffect, useRef, useState} from "react";
import {cn} from "@/lib/utils";

/**
 * A number that reacts when it changes.
 *
 * The board polls every five seconds, so a count moving means somebody just
 * tapped in or out. Making that visible is the difference between a wall of
 * numbers and a display you can tell something happened on from across the room.
 *
 * Remounting on change (via `key`) restarts the CSS animation, which is more
 * reliable than toggling a class and waiting for animationend.
 */
export function AnimatedCount({value, className}: { value: number; className?: string }) {
    const [generation, setGeneration] = useState(0);
    const previous = useRef(value);

    useEffect(() => {
        if (previous.current === value) return;
        previous.current = value;
        setGeneration((g) => g + 1);
    }, [value]);

    return (
        <span key={generation} className={cn("count-pop tabular", className)}>
            {value}
        </span>
    );
}

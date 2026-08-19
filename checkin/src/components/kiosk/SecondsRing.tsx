"use client";

import {useEffect, useState} from "react";

const RADIUS = 17;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The always-moving proof that this screen is alive.
 *
 * A kiosk that has frozen or lost the network renders identically to a working
 * one, and nobody notices for hours. This ring sweeps once a minute so motion
 * is always visible, and turns amber the moment the board stops polling — one
 * element covering both "the screen is running" and "the data is current".
 *
 * The sweep is pure CSS, synced to the wall clock ONCE with a negative
 * animation-delay. No per-second re-render: this runs for eight hours a day.
 */
export function SecondsRing({isStale, size = 44}: { isStale?: boolean; size?: number }) {
    const [offset, setOffset] = useState<number | null>(null);

    useEffect(() => {
        const now = new Date();
        setOffset(-(now.getSeconds() + now.getMilliseconds() / 1000));
    }, []);

    // Until synced, render the track only — a ring starting mid-sweep on the
    // server would jump on hydration.
    const colour = isStale ? "#f59e0b" : "#10b981";

    return (
        <span
            className="relative inline-flex shrink-0"
            style={{width: size, height: size}}
            title={isStale ? "Mất kết nối tới máy chủ" : "Đang cập nhật"}
        >
            <svg width={size} height={size} viewBox="0 0 44 44" style={{transform: "rotate(-90deg)"}}>
                <circle cx="22" cy="22" r={RADIUS} fill="none" stroke="#27272a" strokeWidth="3"/>
                {offset !== null && (
                    <circle
                        className="seconds-sweep"
                        cx="22" cy="22" r={RADIUS}
                        fill="none" stroke={colour} strokeWidth="3" strokeLinecap="round"
                        strokeDasharray={CIRCUMFERENCE}
                        style={{animationDelay: `${offset}s`}}
                    />
                )}
            </svg>
            <span
                className="absolute inset-0 m-auto rounded-full transition-colors"
                style={{width: 5, height: 5, background: colour, opacity: isStale ? 1 : 0.55}}
            />
        </span>
    );
}

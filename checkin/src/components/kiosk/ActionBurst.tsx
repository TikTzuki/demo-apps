"use client";

import type {AttendanceAction} from "@/components/attendance/ActionModal";

/**
 * The one-shot burst behind a check-in or check-out result.
 *
 * Composition is borrowed from flat-colour poster art — diagonal wipe, ring
 * burst, halftone pop, chevrons, sparks. The palette is NOT: it uses the action
 * colour, because green-means-in and amber-means-out is a convention the whole
 * app leans on, and a rainbow here would be the loudest thing on screen saying
 * nothing.
 *
 * Every layer clears within ~0.6s so it never sits on top of the hours.
 */
export function ActionBurst({action}: { action: AttendanceAction }) {
    const colour = BURST_COLOUR[action];
    const fromRight = action === "CHECK_OUT";

    return (
        <div className="burst" aria-hidden="true" style={{["--burst-color" as string]: colour}}>
            <div className="burst-wipe" data-from={fromRight ? "right" : "left"}/>
            <div className="burst-dots"/>
            <div className="burst-speed"/>

            <div className="burst-ring"/>
            <div className="burst-ring"/>
            <div className="burst-ring"/>

            {CHEVRONS.map((c, i) => (
                <span key={i} className="burst-chev" style={{top: c.top, left: c.left, animationDelay: c.delay}}>
                    <svg width={c.size} height={c.size} viewBox="0 0 24 24" fill="none"
                         stroke={i === 0 ? "#fafafa" : colour} strokeWidth="3.5"
                         strokeLinecap="round" strokeLinejoin="round">
                        <path d="m5 12 7-7 7 7"/>
                        <path d="m5 19 7-7 7 7"/>
                    </svg>
                </span>
            ))}

            {SPARKS.map((s, i) => (
                <span key={i} className="burst-spark"
                      style={{top: s.top, left: s.left, animationDelay: s.delay, width: s.size, height: s.size}}/>
            ))}
        </div>
    );
}

const BURST_COLOUR: Record<AttendanceAction, string> = {
    CHECK_IN: "#10b981",
    CHECK_OUT: "#f59e0b",
    CHECK_IN_OVERNIGHT: "#6366f1",
};

const CHEVRONS = [
    {top: "31%", left: "9%", size: 86, delay: "0s"},
    {top: "59%", left: "19%", size: 58, delay: "0.07s"},
];

const SPARKS = [
    {top: "22%", left: "34%", delay: "0s", size: 22},
    {top: "70%", left: "30%", delay: "0.06s", size: 22},
    {top: "38%", left: "56%", delay: "0.12s", size: 15},
    {top: "78%", left: "70%", delay: "0.17s", size: 20},
];

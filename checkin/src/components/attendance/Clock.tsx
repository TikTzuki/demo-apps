"use client";

import {useEffect, useState} from "react";
import {localTimeLabel, type OffsetPolicy} from "@/lib/attendance/time";

const WEEKDAYS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

/**
 * Wall-clock for the kiosk, ticking in the office timezone rather than the
 * tablet's — the tablet may be set to anything, and the time shown has to be
 * the one attendance is measured against.
 *
 * Scheduled to the next minute boundary rather than polled on an interval, so
 * the displayed minute changes at the moment it actually changes, and the
 * roll-over animation tells the truth.
 */
export function Clock({policy, className, size = "lg"}: {
    policy: OffsetPolicy;
    className?: string;
    size?: "lg" | "sm";
}) {
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;

        const tick = () => {
            const at = new Date();
            setNow(at);
            // +50ms of slack so we land just after the boundary, never just before.
            timer = setTimeout(tick, 60_000 - (at.getTime() % 60_000) + 50);
        };

        tick();
        return () => clearTimeout(timer);
    }, []);

    if (!now) {
        // Render nothing until mounted: server and client clocks differ, and a
        // mismatch here would hydrate-error on every load.
        return <div className={className} style={{minHeight: 1}}/>;
    }

    const local = new Date(now.getTime() + policy.timezoneOffsetMinutes * 60_000);
    const date = `${WEEKDAYS[local.getUTCDay()]}, ${String(local.getUTCDate()).padStart(2, "0")}/${String(local.getUTCMonth() + 1).padStart(2, "0")}/${local.getUTCFullYear()}`;
    const time = localTimeLabel(now, policy);

    return (
        <div className={className}>
            <div className={size === "lg" ? "flex items-baseline gap-5" : "flex items-baseline gap-3"}>
                {/* Keyed on the minute so the roll-over restarts the animation. */}
                <span
                    key={time}
                    className={
                        size === "lg"
                            ? "clock-tick tabular text-6xl sm:text-7xl font-bold tracking-tight leading-none"
                            : "clock-tick tabular text-3xl font-bold tracking-tight leading-none text-zinc-300"
                    }
                >
                    {time}
                </span>
                <span className={
                    size === "lg"
                        ? "text-base sm:text-lg font-semibold text-zinc-300"
                        : "text-sm text-zinc-500"
                }>{date}</span>
            </div>
        </div>
    );
}

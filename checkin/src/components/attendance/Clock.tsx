"use client";

import {useEffect, useState} from "react";
import {localTimeLabel, type OffsetPolicy} from "@/lib/attendance/time";

const WEEKDAYS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

/**
 * Wall-clock for the kiosk, ticking in the office timezone rather than the
 * tablet's — the tablet may be set to anything, and the time shown has to be
 * the one attendance is measured against.
 */
export function Clock({policy, className, size = "lg"}: {
    policy: OffsetPolicy;
    className?: string;
    size?: "lg" | "sm";
}) {
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        setNow(new Date());
        const id = setInterval(() => setNow(new Date()), 1000 * 20);
        return () => clearInterval(id);
    }, []);

    if (!now) {
        // Render nothing until mounted: server and client clocks differ, and a
        // mismatch here would hydrate-error on every load.
        return <div className={className} style={{minHeight: 1}}/>;
    }

    const local = new Date(now.getTime() + policy.timezoneOffsetMinutes * 60_000);
    const date = `${WEEKDAYS[local.getUTCDay()]}, ${String(local.getUTCDate()).padStart(2, "0")}/${String(local.getUTCMonth() + 1).padStart(2, "0")}/${local.getUTCFullYear()}`;

    return (
        <div className={className}>
            <div className={size === "lg" ? "flex items-baseline gap-5" : "flex items-baseline gap-3"}>
                <span className={
                    size === "lg"
                        ? "tabular text-6xl sm:text-7xl font-bold tracking-tight leading-none"
                        : "tabular text-3xl font-bold tracking-tight leading-none text-zinc-300"
                }>
                    {localTimeLabel(now, policy)}
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

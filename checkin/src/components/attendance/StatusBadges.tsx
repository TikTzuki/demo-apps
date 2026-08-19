"use client";

import {cn} from "@/lib/utils";
import type {DayStatus} from "@/lib/types";

const BADGES: Partial<Record<DayStatus, { label: string; className: string }>> = {
    WORKING: {label: "Đang làm", className: "bg-success/15 text-success"},
    LATE: {label: "Đi muộn", className: "bg-warning/15 text-warning"},
    EARLY_LEAVE: {label: "Về sớm", className: "bg-warning/15 text-warning"},
    OT: {label: "OT", className: "bg-primary/15 text-primary"},
    OT_OVERNIGHT: {label: "OT qua đêm", className: "bg-indigo-100 text-indigo-700"},
    MISSING_CHECKOUT: {label: "Thiếu check-out", className: "bg-danger/15 text-danger"},
    ABSENT: {label: "Vắng", className: "bg-gray-100 text-gray-500"},
};

/** PRESENT is implied by every other badge, so it is never rendered on its own. */
export function StatusBadges({statuses, className}: { statuses: readonly DayStatus[]; className?: string }) {
    const visible = statuses.filter((s): s is keyof typeof BADGES => s in BADGES);
    if (visible.length === 0) return null;

    return (
        <div className={cn("flex flex-wrap gap-1", className)}>
            {visible.map((status) => (
                <span
                    key={status}
                    className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        BADGES[status]!.className
                    )}
                >
                    {BADGES[status]!.label}
                </span>
            ))}
        </div>
    );
}

"use client";

import {cn} from "@/lib/utils";
import {formatDuration, localTimeLabel, type OffsetPolicy} from "@/lib/attendance/time";
import type {MemberAttendance} from "@/lib/types";
import {Moon} from "lucide-react";

interface MemberTileProps {
    member: MemberAttendance;
    policy: OffsetPolicy;
    onClick: () => void;
    disabled?: boolean;
}

/**
 * One person on the kiosk.
 *
 * Three states, each carried by border AND dot AND background — never colour
 * alone, so it survives a glance from across the room and colour-blind eyes.
 * 84px tall: hittable while walking past without stopping.
 */
export function MemberBubble({member, policy, onClick, disabled}: MemberTileProps) {
    const isTappable = member.state !== "DONE" || member.canCheckInOvernight;

    const sub =
        member.state === "WORKING" && member.openedAt
            ? `Vào ca ${localTimeLabel(new Date(member.openedAt), policy)}`
            : member.state === "DONE" && member.lastCheckOutAt
                ? `${localTimeLabel(new Date(member.lastCheckOutAt), policy)} · ${formatDuration(member.workedMinutes)}`
                : "Chưa vào ca hôm nay";

    return (
        <button
            onClick={onClick}
            disabled={disabled || !isTappable}
            className={cn(
                "h-[84px] w-full rounded-xl border-2 px-4 flex items-center gap-3.5 text-left",
                "transition-transform",
                member.state === "WORKING" && "border-checkin bg-[#0f1c17]",
                member.state === "OUT" && "border-ink-edge bg-ink-raised",
                member.state === "DONE" && "border-ink-line bg-ink-sunken",
                isTappable && !disabled && "active:scale-[0.98]",
                !isTappable && "cursor-default",
                disabled && "opacity-50"
            )}
        >
            <span
                className={cn(
                    "w-2.5 h-2.5 rounded-full shrink-0",
                    member.state === "WORKING" && "bg-checkin animate-pulse-dot",
                    member.state === "OUT" && "bg-zinc-600",
                    member.state === "DONE" && "bg-ink-edge"
                )}
            />

            <span className="flex flex-col gap-1 min-w-0 flex-1">
                <span className={cn("text-lg font-semibold truncate", member.state === "DONE" ? "text-zinc-500" : "text-zinc-50")}>
                    {member.name.split("(")[0].trim()}
                </span>
                <span className="tabular text-sm text-zinc-500 truncate">{sub}</span>
            </span>

            {member.isOvernightSession && <Moon size={16} className="text-overnight shrink-0"/>}

            {member.otMinutes > 0 && (
                <span className="shrink-0 rounded-md bg-checkout px-2.5 py-1 text-xs font-bold text-ink">
                    OT {formatDuration(member.otMinutes)}
                </span>
            )}

            {member.canCheckInOvernight && (
                <span className="shrink-0 rounded-md border border-overnight px-2.5 py-1 text-xs font-semibold text-overnight">
                    Vào ca đêm
                </span>
            )}
        </button>
    );
}

"use client";

import {cn} from "@/lib/utils";
import {formatDuration} from "@/lib/attendance/time";
import type {MemberAttendance} from "@/lib/types";
import {Check, LogIn, Moon} from "lucide-react";

interface MemberBubbleProps {
    member: MemberAttendance;
    teamColor: string;
    index: number;
    onClick: () => void;
    disabled?: boolean;
}

/**
 * Three states, because a day is no longer a single yes/no:
 * OUT (not here yet) · WORKING (on the clock) · DONE (checked out).
 *
 * A DONE member stays tappable once it is late enough to start a night shift.
 */
export function MemberBubble({member, teamColor, index, onClick, disabled}: MemberBubbleProps) {
    const delayClass = `bubble-delay-${(index % 8) + 1}`;
    const isTappable = member.state !== "DONE" || member.canCheckInOvernight;

    return (
        <button
            onClick={onClick}
            disabled={disabled || !isTappable}
            className={cn(
                "relative flex flex-col items-center justify-center",
                "w-24 h-24 sm:w-28 sm:h-28 rounded-full",
                "shadow-lg transition-all animate-float",
                delayClass,
                member.state === "WORKING" && "ring-4 ring-white/70",
                member.state === "DONE" && !member.canCheckInOvernight && "opacity-60 cursor-default",
                isTappable && !disabled && "cursor-pointer hover:scale-110 active:scale-95",
                disabled && "opacity-50 cursor-not-allowed"
            )}
            style={{
                backgroundColor: member.state === "DONE" ? "#94a3b8" : teamColor,
            }}
        >
            {member.isOvernightSession && (
                <Moon className="absolute top-2 right-3 text-white/90" size={14}/>
            )}

            {member.state === "WORKING" && <LogIn className="text-white mb-1" size={18} strokeWidth={3}/>}
            {member.state === "DONE" && <Check className="text-white mb-1" size={18} strokeWidth={3}/>}

            <span className="text-white font-medium text-xs sm:text-sm text-center px-2 drop-shadow-md leading-tight">
                {member.name.split("(")[0].trim()}
            </span>

            {member.state === "WORKING" && (
                <span className="text-white/90 text-[10px] mt-0.5">Đang làm</span>
            )}
            {member.state === "DONE" && (
                <span className="text-white/90 text-[10px] mt-0.5">
                    {member.canCheckInOvernight ? "Vào ca đêm" : formatDuration(member.workedMinutes)}
                </span>
            )}
            {member.otMinutes > 0 && (
                <span className="text-warning text-[10px] font-semibold drop-shadow">
                    OT {formatDuration(member.otMinutes)}
                </span>
            )}
        </button>
    );
}

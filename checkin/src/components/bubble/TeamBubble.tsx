"use client";

import {cn} from "@/lib/utils";
import type {TeamAttendance} from "@/lib/types";
import Link from "next/link";

interface TeamBubbleProps {
    team: TeamAttendance;
    index: number;
}

export function TeamBubble({team, index}: TeamBubbleProps) {
    const total = team.members.length;
    const delayClass = `bubble-delay-${(index % 8) + 1}`;

    return (
        <Link href={`/team/${team.id}`}>
            <div
                className={cn(
                    "flex flex-col items-center justify-center",
                    "w-28 h-28 sm:w-32 sm:h-32 rounded-full",
                    "shadow-lg cursor-pointer",
                    "transition-transform hover:scale-110 active:scale-95",
                    "animate-float",
                    delayClass,
                    team.otCount > 0 && "ring-4 ring-warning ring-offset-2"
                )}
                style={{backgroundColor: team.color}}
            >
                <span className="text-white font-bold text-sm sm:text-base text-center px-2 drop-shadow-md">
                    {team.name}
                </span>
                <span className="text-white/90 text-xs sm:text-sm mt-1 font-medium">
                    {team.workingCount}/{total} có mặt
                </span>
                {team.otCount > 0 && (
                    <span className="text-white text-[10px] mt-0.5">⏱ {team.otCount} OT</span>
                )}
            </div>
        </Link>
    );
}

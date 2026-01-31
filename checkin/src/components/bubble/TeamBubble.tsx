"use client";

import {cn} from "@/lib/utils";
import {Team} from "@/lib/types";
import Link from "next/link";

interface TeamBubbleProps {
    team: Team;
    index: number;
}

export function TeamBubble({team, index}: TeamBubbleProps) {
    const checkedIn = team.members.filter((m) => m.checkedIn).length;
    const total = team.members.length;
    const isComplete = checkedIn === total;

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
                    isComplete && "ring-4 ring-success ring-offset-2"
                )}
                style={{backgroundColor: team.color}}
            >
        <span className="text-white font-bold text-sm sm:text-base text-center px-2 drop-shadow-md">
          {team.name}
        </span>
                <span
                    className={cn(
                        "text-white/90 text-xs sm:text-sm mt-1 font-medium",
                        isComplete && "text-success-foreground"
                    )}
                >
          {checkedIn}/{total}
                    {isComplete && " ✓"}
        </span>
            </div>
        </Link>
    );
}

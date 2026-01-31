"use client";

import {cn} from "@/lib/utils";
import {TeamStats} from "@/lib/types";
import {Check, ChevronRight} from "lucide-react";
import Link from "next/link";

interface TeamProgressCardProps {
    team: TeamStats;
}

export function TeamProgressCard({team}: TeamProgressCardProps) {
    const percentage = team.totalMembers > 0
        ? (team.checkedIn / team.totalMembers) * 100
        : 0;

    return (
        <Link href={`/stats/team/${team.teamId}`}>
            <div
                className={cn(
                    "bg-white rounded-2xl p-4 shadow-lg",
                    "transition-all hover:scale-[1.02] active:scale-[0.98]",
                    "cursor-pointer"
                )}
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-4 h-4 rounded-full"
                            style={{backgroundColor: team.color}}
                        />
                        <span className="font-semibold text-gray-800">{team.teamName}</span>
                    </div>
                    <div className="flex items-center gap-2">
            <span className="text-gray-600 text-sm">
              {team.checkedIn}/{team.totalMembers}
            </span>
                        {team.isComplete && (
                            <Check className="text-success" size={18} strokeWidth={3}/>
                        )}
                        <ChevronRight className="text-gray-400" size={18}/>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={cn(
                            "h-full rounded-full transition-all duration-500",
                            team.isComplete ? "bg-success" : "bg-primary"
                        )}
                        style={{width: `${percentage}%`}}
                    />
                </div>
            </div>
        </Link>
    );
}

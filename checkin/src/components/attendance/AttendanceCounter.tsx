"use client";

import {cn} from "@/lib/utils";
import {Moon, Timer, Users} from "lucide-react";
import type {AttendanceBoard} from "@/lib/types";

interface AttendanceCounterProps {
    totals: AttendanceBoard["totals"];
    className?: string;
}

export function AttendanceCounter({totals, className}: AttendanceCounterProps) {
    const {totalMembers, working, done, onOt, onOvernight} = totals;
    const percentage = totalMembers > 0 ? ((working + done) / totalMembers) * 100 : 0;

    return (
        <div className={cn("bg-white/20 backdrop-blur-sm rounded-2xl p-4", className)}>
            <div className="flex items-center gap-3 mb-3">
                <Users className="text-white" size={20}/>
                <span className="text-white font-medium">Đang có mặt</span>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
                <span className="text-4xl font-bold text-white">{working}</span>
                <span className="text-white/70 text-lg">/ {totalMembers} người</span>
            </div>

            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                <div
                    className="h-full bg-success rounded-full transition-all duration-500"
                    style={{width: `${percentage}%`}}
                />
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-white/80 text-sm">
                <span>Đã về: {done}</span>
                {onOt > 0 && (
                    <span className="flex items-center gap-1">
                        <Timer size={13}/> OT: {onOt}
                    </span>
                )}
                {onOvernight > 0 && (
                    <span className="flex items-center gap-1">
                        <Moon size={13}/> Ca đêm: {onOvernight}
                    </span>
                )}
            </div>
        </div>
    );
}

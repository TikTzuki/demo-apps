"use client";

import {cn} from "@/lib/utils";
import {Users} from "lucide-react";

interface CheckinCounterProps {
    checkedIn: number;
    total: number;
    className?: string;
}

export function CheckinCounter({
                                   checkedIn,
                                   total,
                                   className,
                               }: CheckinCounterProps) {
    const percentage = total > 0 ? (checkedIn / total) * 100 : 0;

    return (
        <div
            className={cn(
                "bg-white/20 backdrop-blur-sm rounded-2xl p-4",
                className
            )}
        >
            <div className="flex items-center gap-3 mb-3">
                <Users className="text-white" size={20}/>
                <span className="text-white font-medium">Đã check-in</span>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
                <span className="text-4xl font-bold text-white">{checkedIn}</span>
                <span className="text-white/70 text-lg">/ {total} người</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                <div
                    className="h-full bg-success rounded-full transition-all duration-500"
                    style={{width: `${percentage}%`}}
                />
            </div>
            <div className="text-right mt-1">
        <span className="text-white/80 text-sm">
          {percentage.toFixed(1)}%
        </span>
            </div>
        </div>
    );
}

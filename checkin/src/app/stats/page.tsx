"use client";

import Link from "next/link";
import {ArrowLeft, RefreshCw} from "lucide-react";
import {useState} from "react";
import {useBoard} from "@/lib/hooks/useBoard";
import {AttendanceCounter} from "@/components/attendance/AttendanceCounter";
import {StatusBadges} from "@/components/attendance/StatusBadges";
import {formatDuration, localTimeLabel} from "@/lib/attendance/time";
import {cn} from "@/lib/utils";
import type {MemberAttendance} from "@/lib/types";

const STATE_DOT: Record<MemberAttendance["state"], string> = {
    WORKING: "bg-success",
    DONE: "bg-gray-400",
    OUT: "bg-gray-200",
};

export default function StatsPage() {
    const {board, isLoading, refresh} = useBoard();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refresh();
        setIsRefreshing(false);
    };

    if (isLoading || !board) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-white text-xl">Đang tải...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 pb-8">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/">
                    <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                        <ArrowLeft className="text-white" size={20}/>
                    </button>
                </Link>
                <div className="flex-1 text-center">
                    <h1 className="text-xl sm:text-2xl font-bold text-white">Bảng chấm công hôm nay</h1>
                    <p className="text-white/70 text-sm">
                        Ngày công {board.workDate} · OT từ {board.policy.otStartTime} · Ca đêm từ{" "}
                        {board.policy.overnightStartTime}
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                    <RefreshCw className={cn("text-white", isRefreshing && "animate-spin")} size={18}/>
                </button>
            </div>

            <AttendanceCounter totals={board.totals} className="mb-6"/>

            <div className="space-y-4">
                {board.teams.map((team) => (
                    <div key={team.id} className="bg-white rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full" style={{backgroundColor: team.color}}/>
                                <span className="font-semibold text-gray-800">{team.name}</span>
                            </div>
                            <span className="text-gray-500 text-sm">
                                {team.workingCount} đang làm / {team.members.length}
                            </span>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {team.members.map((member) => (
                                <div key={member.id} className="flex items-center gap-3 py-2">
                                    <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", STATE_DOT[member.state])}/>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-800 truncate">
                                            {member.name.split("(")[0].trim()}
                                        </p>
                                        <p className="text-gray-500 text-xs">
                                            {member.openedAt && `Vào ${localTimeLabel(new Date(member.openedAt), board.policy)}`}
                                            {member.lastCheckOutAt && ` · Ra ${localTimeLabel(new Date(member.lastCheckOutAt), board.policy)}`}
                                            {member.workedMinutes > 0 && ` · ${formatDuration(member.workedMinutes)}`}
                                            {member.state === "OUT" && !member.lastCheckOutAt && "Chưa check-in"}
                                        </p>
                                        <StatusBadges statuses={member.statuses} className="mt-1"/>
                                    </div>
                                    {member.otMinutes > 0 && (
                                        <span className="text-warning font-semibold text-sm flex-shrink-0">
                                            +{formatDuration(member.otMinutes)}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

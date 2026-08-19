"use client";

import Link from "next/link";
import {BarChart3, ShieldCheck} from "lucide-react";
import {useBoard} from "@/lib/hooks/useBoard";
import {TeamBubble} from "@/components/bubble/TeamBubble";
import {AttendanceCounter} from "@/components/attendance/AttendanceCounter";
import {CuteFace} from "@/components/cute/CuteFace";

export default function HomePage() {
    const {board, isLoading, error} = useBoard();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-white text-xl">Đang tải...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 pb-8">
            <div className="text-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">⏰ CHECK IN</h1>
                <p className="text-white/80 text-sm sm:text-base">NEWERA.INC</p>
                <CuteFace size="md" expression="happy" className="text-white mt-2"/>
            </div>

            {error && (
                <div className="bg-danger/20 border border-danger/40 text-white rounded-xl p-3 mb-4 text-center text-sm">
                    {error}
                </div>
            )}

            {board && <AttendanceCounter totals={board.totals} className="mb-6"/>}

            <div className="grid grid-cols-2 gap-3 mb-6">
                <Link href="/stats">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 flex items-center justify-center gap-2 hover:bg-white/30 transition-colors">
                        <BarChart3 className="text-white" size={18}/>
                        <span className="text-white font-medium text-sm">Bảng hôm nay</span>
                    </div>
                </Link>
                <Link href="/admin">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 flex items-center justify-center gap-2 hover:bg-white/30 transition-colors">
                        <ShieldCheck className="text-white" size={18}/>
                        <span className="text-white font-medium text-sm">Quản trị</span>
                    </div>
                </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                {board?.teams.map((team, index) => (
                    <TeamBubble key={team.id} team={team} index={index}/>
                ))}
            </div>

            <p className="text-center text-white/60 text-sm mt-8">
                Chọn đội của bạn để check-in / check-out
            </p>
        </div>
    );
}

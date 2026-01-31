"use client";

import {useEffect, useState} from "react";
import {CheckinStats, Team} from "@/lib/types";
import {TeamBubble} from "@/components/bubble/TeamBubble";
import {CheckinCounter} from "@/components/checkin/CheckinCounter";
import {CuteFace} from "@/components/cute/CuteFace";
import {BarChart3} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [stats, setStats] = useState<CheckinStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [teamsRes, statsRes] = await Promise.all([
                fetch("/api/teams"),
                fetch("/api/stats"),
            ]);

            const teamsData = await teamsRes.json();
            const statsData = await statsRes.json();

            if (teamsData.success) setTeams(teamsData.data);
            if (statsData.success) setStats(statsData.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Auto refresh every 5 seconds
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-white text-xl">Đang tải...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 pb-8">
            {/* Header */}
            <div className="text-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                    🎉 HACKATHON 2026
                </h1>
                <p className="text-white/80 text-sm sm:text-base">NEWERA.INC CHECK-IN</p>
                <CuteFace size="md" expression="happy" className="text-white mt-2"/>
            </div>

            {/* Stats Counter */}
            {stats && (
                <CheckinCounter
                    checkedIn={stats.checkedIn}
                    total={stats.totalMembers}
                    className="mb-6"
                />
            )}

            {/* Stats Link */}
            <Link href="/stats">
                <div
                    className="bg-white/20 backdrop-blur-sm rounded-xl p-3 mb-6 flex items-center justify-center gap-2 hover:bg-white/30 transition-colors">
                    <BarChart3 className="text-white" size={20}/>
                    <span className="text-white font-medium">Xem thống kê chi tiết</span>
                </div>
            </Link>

            {/* Team Bubbles */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                {teams.map((team, index) => (
                    <TeamBubble key={team.id} team={team} index={index}/>
                ))}
            </div>

            {/* Footer hint */}
            <p className="text-center text-white/60 text-sm mt-8">
                Chọn đội của bạn để check-in
            </p>
        </div>
    );
}

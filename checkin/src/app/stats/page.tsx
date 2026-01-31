"use client";

import {useEffect, useState} from "react";
import {CheckinStats} from "@/lib/types";
import {CheckinCounter} from "@/components/checkin/CheckinCounter";
import {TeamProgressCard} from "@/components/stats/TeamProgressCard";
import {ArrowLeft, RefreshCw} from "lucide-react";
import Link from "next/link";

export default function StatsPage() {
    const [stats, setStats] = useState<CheckinStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchStats = async (showRefreshing = false) => {
        if (showRefreshing) setIsRefreshing(true);
        try {
            const res = await fetch("/api/stats");
            const data = await res.json();

            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();

        // Auto refresh every 5 seconds
        const interval = setInterval(() => fetchStats(false), 5000);
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
            <div className="flex items-center gap-4 mb-6">
                <Link href="/">
                    <button
                        className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                        <ArrowLeft className="text-white" size={20}/>
                    </button>
                </Link>
                <div className="flex-1 text-center">
                    <h1 className="text-xl sm:text-2xl font-bold text-white">
                        📊 Thống kê Check-in
                    </h1>
                </div>
                <button
                    onClick={() => fetchStats(true)}
                    className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                    disabled={isRefreshing}
                >
                    <RefreshCw
                        className={`text-white ${isRefreshing ? "animate-spin" : ""}`}
                        size={20}
                    />
                </button>
            </div>

            {/* Total Stats */}
            {stats && (
                <CheckinCounter
                    checkedIn={stats.checkedIn}
                    total={stats.totalMembers}
                    className="mb-6"
                />
            )}

            {/* Team Progress Cards */}
            <div className="space-y-3">
                <h2 className="text-white font-semibold mb-3">Theo đội</h2>
                {stats?.teamStats.map((team) => (
                    <TeamProgressCard key={team.teamId} team={team}/>
                ))}
            </div>

            {/* Footer hint */}
            <p className="text-center text-white/60 text-sm mt-8">
                Chọn đội để xem chi tiết và quản lý check-in
            </p>
        </div>
    );
}

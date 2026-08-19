"use client";

import Link from "next/link";
import {BarChart3, ShieldCheck} from "lucide-react";
import {useBoard} from "@/lib/hooks/useBoard";
import {Clock} from "@/components/attendance/Clock";
import {cn} from "@/lib/utils";
import {IdleBackdrop} from "@/components/kiosk/IdleBackdrop";
import {AnimatedCount} from "@/components/kiosk/AnimatedCount";
import {SecondsRing} from "@/components/kiosk/SecondsRing";

export default function HomePage() {
    const {board, isLoading, error, isStale} = useBoard();

    if (isLoading || !board) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="h-8 w-40 rounded bg-ink-line animate-pulse"/>
            </div>
        );
    }

    const {totals, policy} = board;

    return (
        <div className="relative min-h-screen overflow-hidden p-6 sm:p-8 flex flex-col gap-5">
            <IdleBackdrop/>

            <header className="relative flex flex-wrap items-end justify-between gap-6">
                <div className="flex items-center gap-5">
                    <SecondsRing isStale={isStale}/>
                    <div className="flex flex-col gap-2">
                    <Clock policy={policy}/>
                    <p className="text-sm text-zinc-500">
                        Ca chuẩn {policy.shiftStartTime}–{policy.otStartTime} · OT tính từ {policy.otStartTime}
                    </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <Total value={totals.working} label="đang làm" tone="text-checkin"/>
                    <div className="w-px h-10 bg-ink-line"/>
                    <Total value={totals.onOt} label="đang OT" tone="text-checkout"/>
                    <div className="w-px h-10 bg-ink-line"/>
                    <Total value={totals.done} label="đã về" tone="text-zinc-500"/>
                </div>
            </header>

            <div className="relative h-px bg-ink-line"/>

            {isStale && (
                <div className="relative rounded-lg border border-checkout/50 bg-checkout/10 px-4 py-3 text-sm text-zinc-100">
                    Mất kết nối tới máy chủ — số liệu bên dưới là lần cập nhật gần nhất, không phải hiện tại.
                </div>
            )}

            <h1 className="relative text-lg sm:text-xl font-semibold text-zinc-400">Chạm vào phòng ban của bạn</h1>

            <div className="stagger relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {board.teams.map((team) => {
                    const present = team.workingCount;
                    const total = team.members.length;
                    const pct = total > 0 ? Math.round((present / total) * 100) : 0;

                    return (
                        <Link key={team.id} href={`/team/${team.id}`}>
                            <div
                                className={cn(
                                    "h-[88px] rounded-xl border-2 bg-ink-raised px-4 py-3 flex flex-col justify-between",
                                    "transition-colors active:bg-ink-line",
                                    present > 0 ? "border-ink-edge" : "border-ink-line"
                                )}
                            >
                                <span className="font-semibold leading-tight line-clamp-2">{team.name}</span>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-baseline gap-1.5">
                                        <AnimatedCount
                                            value={present}
                                            className={cn("text-xl font-bold", present > 0 ? "text-checkin" : "text-zinc-600")}
                                        />
                                        <span className="tabular text-sm text-zinc-600">/ {total}</span>
                                    </div>
                                    <div className="h-1 rounded-full bg-ink-line overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-1 rounded-full transition-[width] duration-700",
                                                present > 0 ? "bar-live bg-checkin" : "bg-transparent"
                                            )}
                                            style={{width: `${pct}%`}}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <footer className="relative mt-auto pt-4 flex items-center gap-3">
                <Link href="/stats" className="flex items-center gap-2 rounded-lg border border-ink-line px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
                    <BarChart3 size={16}/> Ai đang ở văn phòng
                </Link>
                <Link href="/admin" className="flex items-center gap-2 rounded-lg border border-ink-line px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
                    <ShieldCheck size={16}/> Quản trị
                </Link>
            </footer>
        </div>
    );
}

function Total({value, label, tone}: { value: number; label: string; tone: string }) {
    return (
        <div className="flex flex-col items-end gap-1">
            <AnimatedCount value={value} className={cn("text-3xl font-bold leading-none", tone)}/>
            <span className="text-xs uppercase tracking-wider text-zinc-500">{label}</span>
        </div>
    );
}

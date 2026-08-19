"use client";

import Link from "next/link";
import {ChevronLeft, Moon} from "lucide-react";
import {useBoard} from "@/lib/hooks/useBoard";
import {Clock} from "@/components/attendance/Clock";
import {formatDuration, localTimeLabel} from "@/lib/attendance/time";
import {cn} from "@/lib/utils";
import {IdleBackdrop} from "@/components/kiosk/IdleBackdrop";
import {SecondsRing} from "@/components/kiosk/SecondsRing";

/** Always-on board: who is in the office right now, readable across the room. */
export default function StatsPage() {
    const {board, isLoading, isStale} = useBoard();

    if (isLoading || !board) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="h-8 w-40 rounded bg-ink-line animate-pulse"/>
            </div>
        );
    }

    const present = board.teams
        .map((team) => ({...team, here: team.members.filter((m) => m.state === "WORKING")}))
        .filter((team) => team.here.length > 0);

    return (
        <div className="relative min-h-screen overflow-hidden p-6 sm:p-8 flex flex-col gap-5">
            <IdleBackdrop/>

            <header className="relative flex items-center gap-5">
                <Link href="/" aria-label="Quay lại">
                    <span className="grid h-12 w-12 place-items-center rounded-xl border-2 border-ink-edge text-zinc-400">
                        <ChevronLeft size={22}/>
                    </span>
                </Link>
                <div className="flex-1 flex flex-col gap-1">
                    <h1 className="text-xl sm:text-2xl font-bold">Ai đang ở văn phòng</h1>
                    <p className="text-sm text-zinc-500">
                        Ngày công {board.workDate} · cập nhật mỗi 5 giây
                    </p>
                </div>
                <div className="flex items-center gap-5">
                    <span className="flex items-center gap-2.5 text-sm text-zinc-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-checkin"/> {board.totals.working} đang làm
                    </span>
                    <span className="flex items-center gap-2.5 text-sm text-zinc-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-checkout"/> {board.totals.onOt} đang OT
                    </span>
                    <Clock policy={board.policy} size="sm" className="hidden lg:block"/>
                    <SecondsRing isStale={isStale} size={34}/>
                </div>
            </header>

            <div className="relative h-px bg-ink-line"/>

            {isStale && (
                <div className="relative rounded-lg border border-checkout/50 bg-checkout/10 px-4 py-3 text-sm text-zinc-100">
                    Mất kết nối tới máy chủ — đang hiện số liệu lần cập nhật gần nhất.
                </div>
            )}

            {present.length === 0 ? (
                <div className="flex-1 grid place-items-center">
                    <div className="flex flex-col items-center gap-3 text-center">
                        <p className="text-xl font-semibold text-zinc-300">Chưa có ai vào ca hôm nay</p>
                        <p className="text-sm text-zinc-600">Bảng sẽ tự cập nhật khi có người check-in.</p>
                    </div>
                </div>
            ) : (
                <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-5">
                    {present.map((team) => (
                        <div key={team.id} className="flex flex-col gap-2.5">
                            <div className="flex items-baseline justify-between border-b-2 border-ink-line pb-2">
                                <span className="font-semibold text-zinc-300 truncate">{team.name}</span>
                                <span className="tabular text-sm font-semibold text-checkin shrink-0 ml-2">
                                    {team.here.length}/{team.members.length}
                                </span>
                            </div>
                            {team.here.map((member) => (
                                <div key={member.id} className="flex items-center gap-2.5 py-1">
                                    <span className={cn(
                                        "w-1.5 h-1.5 rounded-full shrink-0",
                                        member.otMinutes > 0 ? "bg-checkout" : "bg-checkin"
                                    )}/>
                                    <span className="text-sm text-zinc-300 truncate flex-1">
                                        {member.name.split("(")[0].trim()}
                                    </span>
                                    {member.isOvernightSession && <Moon size={12} className="text-overnight shrink-0"/>}
                                    <span className="tabular text-xs text-zinc-600 shrink-0">
                                        {member.otMinutes > 0
                                            ? `+${formatDuration(member.otMinutes)}`
                                            : member.openedAt
                                                ? localTimeLabel(new Date(member.openedAt), board.policy)
                                                : ""}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

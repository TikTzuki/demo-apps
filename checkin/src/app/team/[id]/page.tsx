"use client";

import {useMemo, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import Link from "next/link";
import {ChevronLeft} from "lucide-react";
import {useBoard} from "@/lib/hooks/useBoard";
import {MemberBubble} from "@/components/bubble/MemberBubble";
import {ActionModal, type AttendanceAction} from "@/components/attendance/ActionModal";
import {Clock} from "@/components/attendance/Clock";
import type {MemberAttendance} from "@/lib/types";
import {IdleBackdrop} from "@/components/kiosk/IdleBackdrop";

/** Tapping a person does whatever comes next for them — one control, not three. */
function nextAction(member: MemberAttendance): AttendanceAction | null {
    if (member.state === "WORKING") return "CHECK_OUT";
    if (member.state === "OUT") return "CHECK_IN";
    return member.canCheckInOvernight ? "CHECK_IN_OVERNIGHT" : null;
}

export default function TeamPage() {
    const params = useParams();
    const router = useRouter();
    const teamId = params.id as string;

    const {board, isLoading, refresh} = useBoard();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const team = useMemo(() => board?.teams.find((t) => t.id === teamId) ?? null, [board, teamId]);
    const selected = team?.members.find((m) => m.id === selectedId) ?? null;
    const action = selected ? nextAction(selected) : null;

    const handleConfirm = async () => {
        if (!selected || !action || !team) return;

        setIsSubmitting(true);
        setErrorMessage(null);
        try {
            const endpoint = action === "CHECK_OUT" ? "checkout" : "checkin";
            const response = await fetch(`/api/attendance/${endpoint}`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({memberId: selected.id}),
            });
            const payload = await response.json();

            if (!payload.success) {
                setErrorMessage(payload.error ?? "Không thể thực hiện");
                setSelectedId(null);
                await refresh();
                return;
            }

            const r = payload.data;
            const query = new URLSearchParams({
                name: r.memberName,
                team: team.name,
                action: r.action,
                kind: r.kind,
                at: r.at,
                worked: String(r.workedMinutes),
                ot: String(r.otMinutes),
            });
            router.push(`/success?${query.toString()}`);
        } catch {
            setErrorMessage("Mất kết nối tới máy chủ, vui lòng thử lại");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || !board) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="h-8 w-40 rounded bg-ink-line animate-pulse"/>
            </div>
        );
    }

    if (!team) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-xl text-zinc-300">Phòng ban không tồn tại</p>
                <Link href="/" className="text-checkout underline">Về màn hình chính</Link>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-hidden p-6 sm:p-8 flex flex-col gap-5">
            <IdleBackdrop/>

            <header className="relative flex items-center gap-5">
                <Link href="/" aria-label="Quay lại">
                    <span className="grid h-14 w-14 place-items-center rounded-xl border-2 border-ink-edge text-zinc-400 active:bg-ink-raised transition-colors">
                        <ChevronLeft size={26}/>
                    </span>
                </Link>
                <div className="flex-1 flex flex-col gap-1">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{team.name}</h1>
                    <p className="text-sm text-zinc-500">
                        {team.workingCount} đang làm · {team.doneCount} đã về · {team.members.length} người
                    </p>
                </div>
                <Clock policy={board.policy} size="sm" className="hidden sm:block"/>
            </header>

            <div className="relative h-px bg-ink-line"/>

            {errorMessage && (
                <div className="rounded-lg border border-danger/50 bg-danger/10 px-4 py-3 text-sm text-zinc-100">
                    {errorMessage}
                </div>
            )}

            <div className="stagger relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {team.members.map((member) => (
                    <MemberBubble
                        key={member.id}
                        member={member}
                        policy={board.policy}
                        onClick={() => nextAction(member) && setSelectedId(member.id)}
                        disabled={isSubmitting}
                    />
                ))}
            </div>

            <footer className="relative mt-auto pt-4 flex flex-wrap items-center gap-x-7 gap-y-2 text-sm text-zinc-500">
                <Legend colour="bg-zinc-600" label="Chưa vào ca — chạm để check-in"/>
                <Legend colour="bg-checkin" label="Đang làm — chạm để check-out"/>
                <Legend colour="bg-ink-edge" label="Đã về"/>
            </footer>

            <ActionModal
                isOpen={selected !== null && action !== null}
                onClose={() => setSelectedId(null)}
                onConfirm={handleConfirm}
                member={selected}
                teamName={team.name}
                action={action ?? "CHECK_IN"}
                policy={board.policy}
                isLoading={isSubmitting}
            />
        </div>
    );
}

function Legend({colour, label}: { colour: string; label: string }) {
    return (
        <span className="flex items-center gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full ${colour}`}/>
            {label}
        </span>
    );
}

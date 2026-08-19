"use client";

import {useMemo, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import Link from "next/link";
import {ArrowLeft} from "lucide-react";
import {useBoard} from "@/lib/hooks/useBoard";
import {MemberBubble} from "@/components/bubble/MemberBubble";
import {ActionModal, type AttendanceAction} from "@/components/attendance/ActionModal";
import type {MemberAttendance} from "@/lib/types";

/** Tapping a member does whatever comes next for them, so there is one control, not three. */
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

            const result = payload.data;
            const query = new URLSearchParams({
                name: result.memberName,
                team: team.name,
                action: result.action,
                kind: result.kind,
                worked: String(result.workedMinutes),
                ot: String(result.otMinutes),
                overnight: String(result.overnightOtMinutes),
            });
            router.push(`/success?${query.toString()}`);
        } catch {
            setErrorMessage("Có lỗi xảy ra, vui lòng thử lại");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-white text-xl">Đang tải...</div>
            </div>
        );
    }

    if (!team) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <div className="text-white text-xl">Đội không tồn tại</div>
                <Link href="/" className="text-white/80 underline">Về trang chủ</Link>
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
                    <h1 className="text-xl sm:text-2xl font-bold text-white">{team.name}</h1>
                    <p className="text-white/80 text-sm">
                        {team.workingCount} đang làm · {team.doneCount} đã về
                        {team.otCount > 0 && ` · ${team.otCount} OT`}
                    </p>
                </div>
                <div className="w-10"/>
            </div>

            {errorMessage && (
                <div className="bg-danger/20 border border-danger/40 text-white rounded-xl p-3 mb-4 text-center text-sm">
                    {errorMessage}
                </div>
            )}

            <div className="flex flex-wrap justify-center gap-4">
                {team.members.map((member, index) => (
                    <MemberBubble
                        key={member.id}
                        member={member}
                        teamColor={team.color}
                        index={index}
                        onClick={() => nextAction(member) && setSelectedId(member.id)}
                        disabled={isSubmitting}
                    />
                ))}
            </div>

            <p className="text-center text-white/60 text-sm mt-8">
                Chọn tên của bạn để check-in hoặc check-out
            </p>

            <ActionModal
                isOpen={selected !== null && action !== null}
                onClose={() => setSelectedId(null)}
                onConfirm={handleConfirm}
                member={selected}
                teamName={team.name}
                action={action ?? "CHECK_IN"}
                policy={board!.policy}
                isLoading={isSubmitting}
            />
        </div>
    );
}

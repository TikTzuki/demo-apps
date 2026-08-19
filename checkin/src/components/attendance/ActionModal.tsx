"use client";

import {LogIn, LogOut, Moon} from "lucide-react";
import {formatDuration, localTimeLabel, type OffsetPolicy} from "@/lib/attendance/time";
import type {MemberAttendance} from "@/lib/types";
import {cn} from "@/lib/utils";
import {useEffect} from "react";

export type AttendanceAction = "CHECK_IN" | "CHECK_OUT" | "CHECK_IN_OVERNIGHT";

interface ActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    member: MemberAttendance | null;
    teamName: string;
    action: AttendanceAction;
    policy: OffsetPolicy;
    isLoading?: boolean;
}

/** Each action owns a colour, so the confirm screen is never ambiguous. */
const COPY: Record<AttendanceAction, {
    title: string; cta: string; icon: typeof LogIn;
    accent: string; accentBg: string; accentText: string;
}> = {
    CHECK_IN: {
        title: "Bắt đầu ca làm việc?", cta: "Vào ca", icon: LogIn,
        accent: "border-checkin", accentBg: "bg-checkin", accentText: "text-checkin",
    },
    CHECK_OUT: {
        title: "Kết thúc ca làm việc?", cta: "Ra ca", icon: LogOut,
        accent: "border-checkout", accentBg: "bg-checkout", accentText: "text-checkout",
    },
    CHECK_IN_OVERNIGHT: {
        title: "Vào ca đêm?", cta: "Vào ca đêm", icon: Moon,
        accent: "border-overnight", accentBg: "bg-overnight", accentText: "text-overnight",
    },
};

export function ActionModal({
                                isOpen, onClose, onConfirm, member, teamName, action, policy, isLoading,
                            }: ActionModalProps) {
    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "unset";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen || !member) return null;

    const copy = COPY[action];
    const Icon = copy.icon;

    return (
        <div className="fixed inset-0 z-50 grid place-items-center p-5">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/>

            <div className={cn(
                "relative z-10 w-full max-w-md rounded-2xl border-2 bg-ink-raised p-7 animate-flash-in",
                copy.accent
            )}>
                <div className="flex items-center gap-4 mb-6">
                    <span className={cn("grid h-16 w-16 place-items-center rounded-xl shrink-0", copy.accentBg)}>
                        <Icon size={30} className="text-ink" strokeWidth={2.5}/>
                    </span>
                    <div className="flex flex-col gap-1 min-w-0">
                        <h2 className="text-xl font-bold">{copy.title}</h2>
                        <p className="text-sm text-zinc-500 truncate">{teamName}</p>
                    </div>
                </div>

                <div className="rounded-xl bg-ink px-5 py-4 mb-6">
                    <p className="text-2xl font-bold truncate">{member.name.split("(")[0].trim()}</p>
                    {member.openedAt && (
                        <p className="tabular text-sm text-zinc-500 mt-1.5">
                            Vào ca lúc {localTimeLabel(new Date(member.openedAt), policy)}
                        </p>
                    )}
                    {member.workedMinutes > 0 && (
                        <p className="tabular text-sm text-zinc-500">
                            Hôm nay đã làm {formatDuration(member.workedMinutes)}
                            {member.otMinutes > 0 && <> · OT {formatDuration(member.otMinutes)}</>}
                        </p>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 h-14 rounded-xl border-2 border-ink-edge text-base font-semibold text-zinc-300 active:bg-ink transition-colors disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={cn(
                            "flex-[1.4] h-14 rounded-xl text-base font-bold text-ink active:scale-[0.98] transition-transform disabled:opacity-60",
                            copy.accentBg
                        )}
                    >
                        {isLoading ? "Đang xử lý..." : copy.cta}
                    </button>
                </div>
            </div>
        </div>
    );
}

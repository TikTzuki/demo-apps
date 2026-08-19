"use client";

import {Modal} from "@/components/ui/modal";
import {Button} from "@/components/ui/button";
import {formatDuration, localTimeLabel, type OffsetPolicy} from "@/lib/attendance/time";
import type {MemberAttendance} from "@/lib/types";

export type AttendanceAction = "CHECK_IN" | "CHECK_OUT" | "CHECK_IN_OVERNIGHT";

interface ActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    member: MemberAttendance | null;
    teamName: string;
    action: AttendanceAction;
    /** Office timezone, so displayed times match the minutes the server charged. */
    policy: OffsetPolicy;
    isLoading?: boolean;
}

const COPY: Record<AttendanceAction, { icon: string; title: string; cta: string; variant: "success" | "danger" }> = {
    CHECK_IN: {icon: "🌅", title: "Bắt đầu ca làm việc?", cta: "Check-in", variant: "success"},
    CHECK_OUT: {icon: "👋", title: "Kết thúc ca làm việc?", cta: "Check-out", variant: "danger"},
    CHECK_IN_OVERNIGHT: {icon: "🌙", title: "Vào ca đêm (OT qua đêm)?", cta: "Vào ca đêm", variant: "success"},
};

export function ActionModal({
                                isOpen,
                                onClose,
                                onConfirm,
                                member,
                                teamName,
                                action,
                                policy,
                                isLoading,
                            }: ActionModalProps) {
    if (!member) return null;

    const copy = COPY[action];

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="text-center">
                <div className="text-5xl mb-4">{copy.icon}</div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">{copy.title}</h2>

                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <p className="text-lg font-semibold text-gray-900">
                        {member.name.split("(")[0].trim()}
                    </p>
                    <p className="text-gray-500">{teamName}</p>

                    {member.openedAt && (
                        <p className="text-gray-600 text-sm mt-2">
                            Vào ca lúc <strong>{localTimeLabel(new Date(member.openedAt), policy)}</strong>
                        </p>
                    )}
                    {member.workedMinutes > 0 && (
                        <p className="text-gray-600 text-sm">
                            Hôm nay đã làm <strong>{formatDuration(member.workedMinutes)}</strong>
                            {member.otMinutes > 0 && <> · OT <strong>{formatDuration(member.otMinutes)}</strong></>}
                        </p>
                    )}
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="ghost"
                        className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Hủy
                    </Button>
                    <Button variant={copy.variant} className="flex-1" onClick={onConfirm} disabled={isLoading}>
                        {isLoading ? "Đang xử lý..." : copy.cta}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

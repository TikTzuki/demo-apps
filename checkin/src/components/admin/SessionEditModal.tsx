"use client";

import {useEffect, useState} from "react";
import {X} from "lucide-react";
import {Alert, Button, inputClass, Tag} from "@/components/admin/Ui";
import {apiFetch} from "@/lib/api-client";
import {formatDuration} from "@/lib/attendance/time";
import type {SerializedSession} from "@/lib/attendance/serialize";

interface SessionEditModalProps {
    session: SerializedSession | null;
    memberName: string;
    workDate: string;
    /** Day totals as they stand now, so the admin sees what they are changing. */
    totals: { regularMinutes: number; otMinutes: number } | null;
    maxSessionHours?: number;
    onClose: () => void;
    onSaved: () => void;
}

/** ISO instant → the value a `datetime-local` input expects, in the browser's zone. */
function toInputValue(iso: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SessionEditModal({
                                     session, memberName, workDate, totals, maxSessionHours, onClose, onSaved,
                                 }: SessionEditModalProps) {
    const [checkInAt, setCheckInAt] = useState("");
    const [checkOutAt, setCheckOutAt] = useState("");
    const [note, setNote] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isBusy, setIsBusy] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        setCheckInAt(toInputValue(session?.checkInAt ?? null));
        setCheckOutAt(toInputValue(session?.checkOutAt ?? null));
        setNote(session?.note ?? "");
        setError(null);
        setConfirmDelete(false);
    }, [session]);

    if (!session) return null;

    const isMissingCheckout = session.checkOutAt === null;

    const save = async () => {
        if (!note.trim()) {
            setError("Vui lòng ghi lý do sửa — đây là bản ghi chấm công");
            return;
        }
        setIsBusy(true);
        const result = await apiFetch(`/api/admin/sessions/${session.id}`, {
            method: "PATCH",
            json: {
                checkInAt: new Date(checkInAt).toISOString(),
                checkOutAt: checkOutAt ? new Date(checkOutAt).toISOString() : null,
                note: note.trim(),
            },
        });
        setIsBusy(false);
        if (!result.success) return setError(result.error ?? "Không thể lưu");
        onSaved();
    };

    const accept = async () => {
        setIsBusy(true);
        const result = await apiFetch(`/api/admin/sessions/${session.id}/review`, {method: "POST"});
        setIsBusy(false);
        if (!result.success) return setError(result.error ?? "Không thể duyệt");
        onSaved();
    };

    const remove = async () => {
        setIsBusy(true);
        const result = await apiFetch(`/api/admin/sessions/${session.id}`, {method: "DELETE"});
        setIsBusy(false);
        if (!result.success) return setError(result.error ?? "Không thể xoá");
        onSaved();
    };

    return (
        <div className="fixed inset-0 z-50 grid place-items-center p-5">
            <div className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm" onClick={onClose}/>

            <div className="relative z-10 w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-200 flex items-start gap-3">
                    <div className="flex-1 flex flex-col gap-1">
                        <h2 className="text-base font-semibold">
                            {isMissingCheckout ? "Phiên thiếu check-out" : "Sửa phiên chấm công"}
                        </h2>
                        <p className="text-xs text-zinc-500">
                            {memberName} · ngày công {workDate} ·{" "}
                            {session.kind === "OVERNIGHT"
                                ? <span className="text-indigo-700 font-medium">Ca đêm</span>
                                : "Ca ngày"}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600"><X size={18}/></button>
                </div>

                <div className="px-5 py-4 flex flex-col gap-4">
                    {error && <Alert tone="danger">{error}</Alert>}

                    {session.needsReview && !error && (
                        <Alert tone="warning" title="Ca này do hệ thống tự đóng">
                            Nhân viên quên check-out nên hệ thống ghi giờ ra theo quy tắc mặc định.
                            Giờ công vẫn được tính. Hãy sửa nếu biết giờ về thực tế, hoặc bấm Duyệt để xác nhận.
                        </Alert>
                    )}

                    {isMissingCheckout && !error && (
                        <Alert tone="warning">
                            Đã vào ca và chưa ra sau {maxSessionHours ?? 16} giờ. Hệ thống không tự đoán giờ ra —
                            ngày công này tính 0 giờ cho tới khi bạn nhập.
                        </Alert>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-medium text-zinc-600">Giờ vào</span>
                            <input type="datetime-local" value={checkInAt} onChange={(e) => setCheckInAt(e.target.value)}
                                   className={`${inputClass} font-mono`}/>
                        </label>
                        <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-medium text-zinc-600">Giờ ra</span>
                            <input type="datetime-local" value={checkOutAt} onChange={(e) => setCheckOutAt(e.target.value)}
                                   className={`${inputClass} font-mono`}/>
                        </label>
                    </div>

                    <label className="flex flex-col gap-1.5">
                        <span className="flex items-baseline gap-2">
                            <span className="text-xs font-medium text-zinc-600">Lý do sửa</span>
                            <span className="text-xs font-medium text-red-700">bắt buộc</span>
                        </span>
                        <input
                            type="text" value={note} onChange={(e) => setNote(e.target.value)}
                            placeholder="VD: quên check-out, đã xác nhận với quản lý"
                            className={inputClass}
                        />
                    </label>

                    {totals && (
                        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 flex flex-col gap-2">
                            <span className="text-xs uppercase tracking-wide text-zinc-500">Ngày công này hiện là</span>
                            <span className="flex flex-wrap gap-2">
                                <Tag>{formatDuration(totals.regularMinutes)} thường</Tag>
                                {totals.otMinutes > 0 && <Tag tone="ot">{formatDuration(totals.otMinutes)} OT</Tag>}
                            </span>
                        </div>
                    )}
                </div>

                <div className="px-5 py-3.5 border-t border-zinc-200 bg-zinc-50 flex items-center gap-2">
                    {confirmDelete ? (
                        <>
                            <span className="text-sm text-red-800 flex-1">Xoá hẳn phiên này?</span>
                            <Button onClick={() => setConfirmDelete(false)} disabled={isBusy}>Không</Button>
                            <Button variant="danger" onClick={remove} disabled={isBusy}>Xoá vĩnh viễn</Button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setConfirmDelete(true)} disabled={isBusy}
                                className="px-4 py-2.5 rounded-lg border border-red-200 bg-white text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
                            >
                                Xoá phiên
                            </button>
                            <div className="flex-1"/>
                            {session.needsReview && (
                                <Button variant="warning" onClick={accept} disabled={isBusy}>Duyệt</Button>
                            )}
                            <Button onClick={onClose} disabled={isBusy}>Hủy</Button>
                            <Button variant="primary" onClick={save} disabled={isBusy}>
                                {isBusy ? "Đang lưu..." : isMissingCheckout ? "Lưu giờ ra" : "Lưu"}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

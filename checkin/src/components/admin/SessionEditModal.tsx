"use client";

import {useEffect, useState} from "react";
import {Modal} from "@/components/ui/modal";
import {Button} from "@/components/ui/button";
import {apiFetch} from "@/lib/api-client";
import type {SerializedSession} from "@/lib/attendance/serialize";

interface SessionEditModalProps {
    session: SerializedSession | null;
    memberName: string;
    onClose: () => void;
    onSaved: () => void;
}

/** ISO instant → the value a `datetime-local` input expects, in the browser's timezone. */
function toInputValue(iso: string | null): string {
    if (!iso) return "";
    const date = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function SessionEditModal({session, memberName, onClose, onSaved}: SessionEditModalProps) {
    const [checkInAt, setCheckInAt] = useState("");
    const [checkOutAt, setCheckOutAt] = useState("");
    const [note, setNote] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isBusy, setIsBusy] = useState(false);

    useEffect(() => {
        setCheckInAt(toInputValue(session?.checkInAt ?? null));
        setCheckOutAt(toInputValue(session?.checkOutAt ?? null));
        setNote(session?.note ?? "");
        setError(null);
    }, [session]);

    if (!session) return null;

    const handleSave = async () => {
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

        if (!result.success) {
            setError(result.error ?? "Không thể lưu");
            return;
        }
        onSaved();
    };

    const handleDelete = async () => {
        if (!window.confirm(`Xoá phiên chấm công này của ${memberName}?`)) return;

        setIsBusy(true);
        const result = await apiFetch(`/api/admin/sessions/${session.id}`, {method: "DELETE"});
        setIsBusy(false);

        if (!result.success) {
            setError(result.error ?? "Không thể xoá");
            return;
        }
        onSaved();
    };

    return (
        <Modal isOpen onClose={onClose} className="max-w-md">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Sửa phiên chấm công</h2>
            <p className="text-gray-500 text-sm mb-4">
                {memberName} · {session.kind === "OVERNIGHT" ? "Ca đêm" : "Ca ngày"}
            </p>

            {error && <div className="bg-danger/10 text-danger rounded-xl p-3 mb-4 text-sm">{error}</div>}

            <label className="block mb-3">
                <span className="text-sm text-gray-600">Giờ vào</span>
                <input
                    type="datetime-local"
                    value={checkInAt}
                    onChange={(e) => setCheckInAt(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-primary focus:outline-none"
                />
            </label>

            <label className="block mb-3">
                <span className="text-sm text-gray-600">Giờ ra (để trống nếu chưa check-out)</span>
                <input
                    type="datetime-local"
                    value={checkOutAt}
                    onChange={(e) => setCheckOutAt(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-primary focus:outline-none"
                />
            </label>

            <label className="block mb-5">
                <span className="text-sm text-gray-600">Lý do sửa *</span>
                <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="VD: quên check-out, xác nhận với quản lý"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-primary focus:outline-none"
                />
            </label>

            <div className="flex gap-2">
                <Button
                    variant="danger"
                    size="sm"
                    className="flex-1"
                    onClick={handleDelete}
                    disabled={isBusy}
                >
                    Xoá
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
                    onClick={onClose}
                    disabled={isBusy}
                >
                    Hủy
                </Button>
                <Button variant="primary" size="sm" className="flex-1" onClick={handleSave} disabled={isBusy}>
                    {isBusy ? "Đang lưu..." : "Lưu"}
                </Button>
            </div>
        </Modal>
    );
}

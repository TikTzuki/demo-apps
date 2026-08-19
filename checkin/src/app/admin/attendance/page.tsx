"use client";

import {useCallback, useEffect, useState} from "react";
import {Download, Moon, Pencil} from "lucide-react";
import {Button} from "@/components/ui/button";
import {StatusBadges} from "@/components/attendance/StatusBadges";
import {SessionEditModal} from "@/components/admin/SessionEditModal";
import {apiFetch, downloadFile} from "@/lib/api-client";
import {formatDuration, localTimeLabel} from "@/lib/attendance/time";
import type {SerializedDayRow, SerializedSession} from "@/lib/attendance/serialize";
import type {AttendancePolicy} from "@/lib/attendance/compute";

interface RangePayload {
    from: string;
    to: string;
    policy: AttendancePolicy;
    rows: SerializedDayRow[];
}

/** Today's business day in the browser's timezone — a sane default range. */
function todayKey(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export default function AdminAttendancePage() {
    const [from, setFrom] = useState(todayKey());
    const [to, setTo] = useState(todayKey());
    const [data, setData] = useState<RangePayload | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [editing, setEditing] = useState<{ session: SerializedSession; memberName: string } | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        const result = await apiFetch<RangePayload>(`/api/admin/sessions?from=${from}&to=${to}`);
        setIsLoading(false);

        if (!result.success || !result.data) {
            setError(result.error ?? "Không thể tải dữ liệu");
            return;
        }
        setError(null);
        setData(result.data);
    }, [from, to]);

    useEffect(() => {
        load();
    }, [load]);

    const handleExport = async () => {
        setError(await downloadFile(`/api/admin/export/excel?from=${from}&to=${to}`, "cham-cong.xlsx"));
    };

    const totals = (data?.rows ?? []).reduce(
        (acc, row) => ({
            worked: acc.worked + row.workedMinutes,
            ot: acc.ot + row.otMinutes,
            overnight: acc.overnight + row.overnightOtMinutes,
        }),
        {worked: 0, ot: 0, overnight: 0}
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Chấm công theo khoảng ngày</h1>
                    <p className="text-gray-500 text-sm">
                        Tổng {formatDuration(totals.worked)} · OT {formatDuration(totals.ot)} · OT qua đêm{" "}
                        {formatDuration(totals.overnight)}
                    </p>
                </div>

                <div className="flex flex-wrap items-end gap-2">
                    <label className="text-sm">
                        <span className="text-gray-500 block">Từ ngày</span>
                        <input
                            type="date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            className="rounded-xl border border-gray-200 px-3 py-2 focus:border-primary focus:outline-none"
                        />
                    </label>
                    <label className="text-sm">
                        <span className="text-gray-500 block">Đến ngày</span>
                        <input
                            type="date"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className="rounded-xl border border-gray-200 px-3 py-2 focus:border-primary focus:outline-none"
                        />
                    </label>
                    <Button variant="primary" size="sm" onClick={handleExport}>
                        <Download size={15} className="mr-1.5"/> Xuất Excel
                    </Button>
                </div>
            </div>

            {error && <div className="bg-danger/10 text-danger rounded-xl p-3 text-sm">{error}</div>}

            <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
                <table className="w-full text-sm min-w-[860px]">
                    <thead className="bg-gray-50 text-gray-500 text-left">
                    <tr>
                        <th className="px-4 py-2 font-medium">Ngày công</th>
                        <th className="px-4 py-2 font-medium">Nhân viên</th>
                        <th className="px-4 py-2 font-medium">Đội</th>
                        <th className="px-4 py-2 font-medium">Phiên làm việc</th>
                        <th className="px-4 py-2 font-medium text-right">Giờ thường</th>
                        <th className="px-4 py-2 font-medium text-right">OT</th>
                        <th className="px-4 py-2 font-medium text-right">OT đêm</th>
                        <th className="px-4 py-2 font-medium">Trạng thái</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {data?.rows.map((row) => (
                        <tr key={`${row.memberId}-${row.workDate}`}>
                            <td className="px-4 py-2 whitespace-nowrap">{row.workDate}</td>
                            <td className="px-4 py-2 font-medium">{row.memberName.split("(")[0].trim()}</td>
                            <td className="px-4 py-2">
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full" style={{backgroundColor: row.teamColor}}/>
                                    {row.teamName}
                                </span>
                            </td>
                            <td className="px-4 py-2">
                                <div className="flex flex-col gap-1">
                                    {row.sessions.map((session) => (
                                        <button
                                            key={session.id}
                                            onClick={() => setEditing({session, memberName: row.memberName})}
                                            className="group inline-flex items-center gap-1.5 text-left hover:text-primary"
                                        >
                                            {session.kind === "OVERNIGHT" && (
                                                <Moon size={13} className="text-indigo-500"/>
                                            )}
                                            <span>
                                                {localTimeLabel(new Date(session.checkInAt), data.policy)} →{" "}
                                                {session.checkOutAt
                                                    ? localTimeLabel(new Date(session.checkOutAt), data.policy)
                                                    : "—"}
                                            </span>
                                            {session.isManual && (
                                                <span className="text-[10px] rounded-full bg-amber-100 text-amber-700 px-1.5">
                                                    sửa tay
                                                </span>
                                            )}
                                            <Pencil size={12} className="opacity-0 group-hover:opacity-100"/>
                                        </button>
                                    ))}
                                </div>
                            </td>
                            <td className="px-4 py-2 text-right">{formatDuration(row.regularMinutes)}</td>
                            <td className="px-4 py-2 text-right font-medium text-warning">
                                {row.otMinutes > 0 ? formatDuration(row.otMinutes) : "—"}
                            </td>
                            <td className="px-4 py-2 text-right font-medium text-indigo-600">
                                {row.overnightOtMinutes > 0 ? formatDuration(row.overnightOtMinutes) : "—"}
                            </td>
                            <td className="px-4 py-2"><StatusBadges statuses={row.statuses}/></td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                {!isLoading && data?.rows.length === 0 && (
                    <p className="p-6 text-center text-gray-400 text-sm">
                        Không có dữ liệu chấm công trong khoảng ngày này.
                    </p>
                )}
                {isLoading && <p className="p-6 text-center text-gray-400 text-sm">Đang tải...</p>}
            </div>

            <SessionEditModal
                session={editing?.session ?? null}
                memberName={editing?.memberName ?? ""}
                onClose={() => setEditing(null)}
                onSaved={() => {
                    setEditing(null);
                    load();
                }}
            />
        </div>
    );
}

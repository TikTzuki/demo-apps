"use client";

import {useCallback, useEffect, useState} from "react";
import {CalendarRange, Download, Moon, Pencil} from "lucide-react";
import {Alert, Button, EmptyState, inputClass, Panel, Tag, TableSkeleton} from "@/components/admin/Ui";
import {SessionEditModal} from "@/components/admin/SessionEditModal";
import {apiFetch, downloadFile} from "@/lib/api-client";
import {formatDuration, localTimeLabel} from "@/lib/attendance/time";
import {cn} from "@/lib/utils";
import type {SerializedDayRow, SerializedSession} from "@/lib/attendance/serialize";
import type {AttendancePolicy} from "@/lib/attendance/compute";

interface RangePayload {
    from: string;
    to: string;
    policy: AttendancePolicy;
    rows: SerializedDayRow[];
}

function todayKey(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function monthStart(): string {
    return `${todayKey().slice(0, 7)}-01`;
}

export default function AdminAttendancePage() {
    const [from, setFrom] = useState(monthStart());
    const [to, setTo] = useState(todayKey());
    const [data, setData] = useState<RangePayload | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [editing, setEditing] = useState<{ row: SerializedDayRow; session: SerializedSession } | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        const result = await apiFetch<RangePayload>(`/api/admin/sessions?from=${from}&to=${to}`);
        setIsLoading(false);
        if (!result.success || !result.data) return setError(result.error ?? "Không thể tải dữ liệu");
        setError(null);
        setData(result.data);
    }, [from, to]);

    useEffect(() => {
        load();
    }, [load]);

    const handleExport = async () =>
        setError(await downloadFile(`/api/admin/export/excel?from=${from}&to=${to}`, "cham-cong.xlsx"));

    const totals = (data?.rows ?? []).reduce(
        (acc, r) => ({
            worked: acc.worked + r.workedMinutes,
            ot: acc.ot + r.otMinutes,
            overnight: acc.overnight + r.overnightOtMinutes,
        }),
        {worked: 0, ot: 0, overnight: 0}
    );

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1.5">
                    <span className="text-xs uppercase tracking-wide text-zinc-500">Từ ngày</span>
                    <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={`${inputClass} font-mono`}/>
                </label>
                <label className="flex flex-col gap-1.5">
                    <span className="text-xs uppercase tracking-wide text-zinc-500">Đến ngày</span>
                    <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={`${inputClass} font-mono`}/>
                </label>

                <div className="flex-1"/>

                <div className="flex items-center gap-6 rounded-lg border border-zinc-200 bg-white px-5 py-2.5">
                    <Summary label="Tổng giờ" value={formatDuration(totals.worked)}/>
                    <Summary label="OT" value={formatDuration(totals.ot)} tone="text-amber-700"/>
                    <Summary label="OT đêm" value={formatDuration(totals.overnight)} tone="text-indigo-700"/>
                </div>

                <Button variant="primary" onClick={handleExport}>
                    <Download size={15}/> Xuất Excel
                </Button>
            </div>

            {error && <Alert tone="danger">{error}</Alert>}

            <Panel>
                {isLoading ? (
                    <TableSkeleton rows={10} cols={7}/>
                ) : data && data.rows.length === 0 ? (
                    <EmptyState
                        icon={<CalendarRange size={26}/>}
                        title="Không có phiên chấm công nào"
                        body={`Từ ${from} đến ${to} không ai check-in. Có thể đây là kỳ nghỉ, hoặc bạn chọn nhầm khoảng ngày.`}
                        action={
                            <Button onClick={() => {
                                setFrom(monthStart());
                                setTo(todayKey());
                            }}>Xem tháng này</Button>
                        }
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[980px]">
                            <thead className="bg-zinc-50 border-b border-zinc-200">
                            <tr className="text-xs uppercase tracking-wide text-zinc-500 text-left">
                                <th className="px-4 py-2.5 font-semibold">Ngày công</th>
                                <th className="px-4 py-2.5 font-semibold">Nhân viên</th>
                                <th className="px-4 py-2.5 font-semibold">Phiên làm việc</th>
                                <th className="px-4 py-2.5 font-semibold text-right">Giờ thường</th>
                                <th className="px-4 py-2.5 font-semibold text-right">OT</th>
                                <th className="px-4 py-2.5 font-semibold text-right">OT đêm</th>
                                <th className="px-4 py-2.5 font-semibold">Trạng thái</th>
                            </tr>
                            </thead>
                            <tbody>
                            {data?.rows.map((row, i) => (
                                <tr key={`${row.memberId}-${row.workDate}`} className={cn("border-b border-zinc-100", i % 2 && "bg-zinc-50/50")}>
                                    <td className="px-4 py-2.5 font-mono text-[13px] text-zinc-600 whitespace-nowrap">{row.workDate}</td>
                                    <td className="px-4 py-2.5 font-medium">{row.memberName.split("(")[0].trim()}</td>
                                    <td className="px-4 py-2">
                                        <div className="flex flex-wrap gap-1.5">
                                            {row.sessions.map((session) => (
                                                <button
                                                    key={session.id}
                                                    onClick={() => setEditing({row, session})}
                                                    className={cn(
                                                        "group flex items-center gap-1.5 rounded-md border px-2 py-1 transition-colors",
                                                        session.kind === "OVERNIGHT"
                                                            ? "border-indigo-200 bg-indigo-50 hover:border-indigo-400"
                                                            : session.needsReview
                                                                ? "border-amber-300 bg-amber-50 hover:border-amber-500"
                                                                : session.isManual
                                                                    ? "border-amber-200 bg-amber-50 hover:border-amber-400"
                                                                    : "border-zinc-200 bg-zinc-50 hover:border-zinc-400"
                                                    )}
                                                >
                                                    {session.kind === "OVERNIGHT" && <Moon size={12} className="text-indigo-600"/>}
                                                    <span className={cn(
                                                        "font-mono text-xs",
                                                        session.kind === "OVERNIGHT" ? "text-indigo-800"
                                                            : session.isManual ? "text-amber-800" : "text-zinc-700"
                                                    )}>
                                                        {localTimeLabel(new Date(session.checkInAt), data.policy)} →{" "}
                                                        {session.checkOutAt ? localTimeLabel(new Date(session.checkOutAt), data.policy) : "—"}
                                                    </span>
                                                    {session.needsReview && <span className="text-[10px] font-semibold text-amber-700">tự đóng</span>}
                                                    {session.isManual && !session.needsReview && <span className="text-[10px] font-semibold text-amber-700">sửa tay</span>}
                                                    <Pencil size={11} className="opacity-0 group-hover:opacity-100 text-zinc-500"/>
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5 font-mono text-[13px] text-right font-medium">{formatDuration(row.regularMinutes)}</td>
                                    <td className={cn("px-4 py-2.5 font-mono text-[13px] text-right", row.otMinutes > 0 ? "font-medium text-amber-700" : "text-zinc-400")}>
                                        {row.otMinutes > 0 ? formatDuration(row.otMinutes) : "—"}
                                    </td>
                                    <td className={cn("px-4 py-2.5 font-mono text-[13px] text-right", row.overnightOtMinutes > 0 ? "font-medium text-indigo-700" : "text-zinc-400")}>
                                        {row.overnightOtMinutes > 0 ? formatDuration(row.overnightOtMinutes) : "—"}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className="flex flex-wrap gap-1.5">
                                            {row.otMinutes > 0 && <Tag tone="ot">OT</Tag>}
                                            {row.overnightOtMinutes > 0 && <Tag tone="overnight">OT qua đêm</Tag>}
                                            {row.statuses.includes("AUTO_CLOSED") && <Tag tone="ot">Chờ duyệt</Tag>}
                                            {row.statuses.includes("MISSING_CHECKOUT") && <Tag tone="danger">Thiếu check-out</Tag>}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>

            <SessionEditModal
                session={editing?.session ?? null}
                memberName={editing?.row.memberName ?? ""}
                workDate={editing?.row.workDate ?? ""}
                totals={editing?.row ?? null}
                maxSessionHours={data?.policy.maxSessionHours}
                onClose={() => setEditing(null)}
                onSaved={() => {
                    setEditing(null);
                    load();
                }}
            />
        </div>
    );
}

function Summary({label, value, tone}: { label: string; value: string; tone?: string }) {
    return (
        <span className="flex flex-col gap-0.5">
            <span className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</span>
            <span className={cn("font-mono text-base font-medium", tone ?? "text-zinc-900")}>{value}</span>
        </span>
    );
}

"use client";

import Link from "next/link";
import {useMemo, useState} from "react";
import {Download, Moon} from "lucide-react";
import {useBoard} from "@/lib/hooks/useBoard";
import {Alert, Button, EmptyState, Panel, Tag, TableSkeleton} from "@/components/admin/Ui";
import {
    EMPTY_FILTERS, isFiltered, StatFilterTile, TodayFilters, type TodayFilterState,
} from "@/components/admin/TodayFilters";
import {SearchX} from "lucide-react";
import {downloadFile} from "@/lib/api-client";
import {formatDuration, localTimeLabel} from "@/lib/attendance/time";
import {cn, normalizeVi} from "@/lib/utils";

export default function AdminTodayPage() {
    const {board, isLoading} = useBoard();
    const [message, setMessage] = useState<string | null>(null);
    const [filters, setFilters] = useState<TodayFilterState>(EMPTY_FILTERS);

    const handleExport = async () => {
        if (!board) return;
        setMessage(await downloadFile(
            `/api/admin/export/excel?from=${board.workDate}&to=${board.workDate}`,
            "cham-cong.xlsx"
        ));
    };

    if (isLoading || !board) {
        return <Panel><TableSkeleton rows={10} cols={7}/></Panel>;
    }

    const {totals, policy} = board;
    // Working first, then those who have left, then the absent. Listing 100
    // absent people above the six on the clock makes the table useless.
    const ORDER = {WORKING: 0, DONE: 1, OUT: 2} as const;
    const members = board.teams
        .flatMap((team) => team.members.map((m) => ({...m, team})))
        .sort((a, b) => ORDER[a.state] - ORDER[b.state] || a.name.localeCompare(b.name, "vi"));

    const counts = {
        working: members.filter((m) => m.state === "WORKING").length,
        done: members.filter((m) => m.state === "DONE").length,
        absent: members.filter((m) => m.state === "OUT").length,
        ot: members.filter((m) => m.otMinutes > 0).length,
        review: members.filter((m) => m.statuses.includes("AUTO_CLOSED")).length,
        missing: members.filter((m) => m.statuses.includes("MISSING_CHECKOUT")).length,
    };

    const visible = members.filter((m) => {
        if (filters.teamId && m.team.id !== filters.teamId) return false;

        if (filters.query.trim()) {
            const q = normalizeVi(filters.query);
            const haystack = normalizeVi(`${m.name} ${m.employeeCode ?? ""}`);
            if (!haystack.includes(q)) return false;
        }

        switch (filters.status) {
            case "WORKING": return m.state === "WORKING";
            case "DONE":    return m.state === "DONE";
            case "ABSENT":  return m.state === "OUT";
            case "OT":      return m.otMinutes > 0;
            case "REVIEW":  return m.statuses.includes("AUTO_CLOSED");
            case "MISSING": return m.statuses.includes("MISSING_CHECKOUT");
            default:        return true;
        }
    });

    const teamOptions = board.teams
        .map((t) => ({id: t.id, name: t.name, count: t.members.length}))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "vi"));

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold">Hôm nay</h1>
                    <p className="text-sm text-zinc-500">
                        Ngày công {board.workDate} · ca {policy.shiftStartTime}–{policy.otStartTime} ·
                        OT từ {policy.otStartTime} · ca đêm từ {policy.overnightStartTime}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/attendance">
                        <Button>Xem theo khoảng ngày</Button>
                    </Link>
                    <Button variant="primary" onClick={handleExport}>
                        <Download size={15}/> Xuất Excel
                    </Button>
                </div>
            </div>

            {message && <Alert tone="danger">{message}</Alert>}

            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                <StatFilterTile label="Đang làm" value={counts.working} note={`/ ${totals.totalMembers}`}
                                tone="text-emerald-600" status="WORKING" filters={filters} onChange={setFilters}/>
                <StatFilterTile label="Đã về" value={counts.done} note="hôm nay"
                                tone="text-zinc-900" status="DONE" filters={filters} onChange={setFilters}/>
                <StatFilterTile label="Chưa vào ca" value={counts.absent} note="hôm nay"
                                tone="text-zinc-400" status="ABSENT" filters={filters} onChange={setFilters}/>
                <StatFilterTile label="Có OT" value={counts.ot} note="người"
                                tone="text-amber-700" status="OT" filters={filters} onChange={setFilters}/>
                <StatFilterTile label="Chờ duyệt" value={counts.review} note="tự đóng ca"
                                tone="text-amber-700" status="REVIEW" filters={filters} onChange={setFilters}/>
                <StatFilterTile label="Thiếu check-out" value={counts.missing} note="cần sửa"
                                tone="text-red-700" status="MISSING" filters={filters} onChange={setFilters}/>
            </div>

            <TodayFilters
                filters={filters}
                onChange={setFilters}
                teams={teamOptions}
                shown={visible.length}
                total={members.length}
            />

            <Panel>
                {visible.length === 0 ? (
                    <EmptyState
                        icon={<SearchX size={26}/>}
                        title="Không có ai khớp bộ lọc"
                        body={
                            filters.query.trim()
                                ? `Không tìm thấy nhân viên nào khớp với "${filters.query.trim()}".`
                                : "Không có nhân viên nào ở trạng thái này hôm nay."
                        }
                        action={<Button onClick={() => setFilters(EMPTY_FILTERS)}>Xoá bộ lọc</Button>}
                    />
                ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[900px]">
                        <thead className="bg-zinc-50 border-b border-zinc-200">
                        <tr className="text-xs uppercase tracking-wide text-zinc-500">
                            <Th>Nhân viên</Th><Th>Phòng ban</Th>
                            <Th right>Vào</Th><Th right>Ra</Th><Th right>Giờ làm</Th><Th right>OT</Th>
                            <Th>Trạng thái</Th>
                        </tr>
                        </thead>
                        <tbody>
                        {visible.map((member, i) => (
                            <tr key={member.id} className={cn("border-b border-zinc-100", i % 2 && "bg-zinc-50/50")}>
                                <Td className={cn("font-medium", member.state === "OUT" && "text-zinc-400")}>
                                    {member.name.split("(")[0].trim()}
                                </Td>
                                <Td className="text-zinc-600">
                                    <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor: member.team.color}}/>
                                        {member.team.name}
                                    </span>
                                </Td>
                                <Td mono right>{member.openedAt ? localTimeLabel(new Date(member.openedAt), policy) : "—"}</Td>
                                <Td mono right>{member.lastCheckOutAt ? localTimeLabel(new Date(member.lastCheckOutAt), policy) : "—"}</Td>
                                <Td mono right className="font-medium">{formatDuration(member.workedMinutes)}</Td>
                                <Td mono right className={member.otMinutes > 0 ? "font-medium text-amber-700" : "text-zinc-400"}>
                                    {member.otMinutes > 0 ? formatDuration(member.otMinutes) : "—"}
                                </Td>
                                <Td>
                                    <span className="flex flex-wrap gap-1.5 items-center">
                                        {member.state === "WORKING" && <Tag tone="working">Đang làm</Tag>}
                                        {member.otMinutes > 0 && <Tag tone="ot">OT</Tag>}
                                        {member.isOvernightSession && <Tag tone="overnight"><Moon size={10} className="inline mr-0.5"/>Ca đêm</Tag>}
                                        {member.statuses.includes("AUTO_CLOSED") && <Tag tone="ot">Chờ duyệt</Tag>}
                                        {member.statuses.includes("MISSING_CHECKOUT") && <Tag tone="danger">Thiếu check-out</Tag>}
                                    </span>
                                </Td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                )}
            </Panel>
        </div>
    );
}

function Th({children, right}: { children: React.ReactNode; right?: boolean }) {
    return <th className={cn("px-4 py-2.5 font-semibold", right ? "text-right" : "text-left")}>{children}</th>;
}

function Td({children, mono, right, className}: {
    children: React.ReactNode; mono?: boolean; right?: boolean; className?: string;
}) {
    return (
        <td className={cn("px-4 py-2.5", mono && "font-mono text-[13px]", right && "text-right", className)}>
            {children}
        </td>
    );
}

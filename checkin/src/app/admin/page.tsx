"use client";

import Link from "next/link";
import {useState} from "react";
import {Download, Moon, Timer, UserCheck, UserX} from "lucide-react";
import {useBoard} from "@/lib/hooks/useBoard";
import {StatusBadges} from "@/components/attendance/StatusBadges";
import {Button} from "@/components/ui/button";
import {downloadFile} from "@/lib/api-client";
import {formatDuration, localTimeLabel} from "@/lib/attendance/time";
import {cn} from "@/lib/utils";

function StatTile({label, value, icon: Icon, tone}: {
    label: string;
    value: number;
    icon: typeof UserCheck;
    tone: string;
}) {
    return (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <Icon size={15} className={tone}/>
                {label}
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    );
}

export default function AdminTodayPage() {
    const {board, isLoading} = useBoard();
    const [message, setMessage] = useState<string | null>(null);

    const handleExport = async () => {
        if (!board) return;
        const error = await downloadFile(
            `/api/admin/export/excel?from=${board.workDate}&to=${board.workDate}`,
            "cham-cong.xlsx"
        );
        setMessage(error);
    };

    if (isLoading || !board) {
        return <p className="text-gray-500">Đang tải...</p>;
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Hôm nay</h1>
                    <p className="text-gray-500 text-sm">
                        Ngày công {board.workDate} · ca {board.policy.shiftStartTime}–{board.policy.otStartTime} ·
                        OT từ {board.policy.otStartTime} · ca đêm từ {board.policy.overnightStartTime}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/attendance">
                        <Button variant="ghost" size="sm" className="bg-white text-gray-700 hover:bg-gray-50">
                            Xem theo khoảng ngày
                        </Button>
                    </Link>
                    <Button variant="primary" size="sm" onClick={handleExport}>
                        <Download size={15} className="mr-1.5"/> Xuất Excel
                    </Button>
                </div>
            </div>

            {message && <div className="bg-danger/10 text-danger rounded-xl p-3 text-sm">{message}</div>}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatTile label="Đang làm" value={board.totals.working} icon={UserCheck} tone="text-success"/>
                <StatTile label="Đã về" value={board.totals.done} icon={UserX} tone="text-gray-400"/>
                <StatTile label="Có OT" value={board.totals.onOt} icon={Timer} tone="text-warning"/>
                <StatTile label="Ca đêm" value={board.totals.onOvernight} icon={Moon} tone="text-indigo-500"/>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-left">
                    <tr>
                        <th className="px-4 py-2 font-medium">Nhân viên</th>
                        <th className="px-4 py-2 font-medium">Đội</th>
                        <th className="px-4 py-2 font-medium">Vào</th>
                        <th className="px-4 py-2 font-medium">Ra</th>
                        <th className="px-4 py-2 font-medium text-right">Giờ làm</th>
                        <th className="px-4 py-2 font-medium text-right">OT</th>
                        <th className="px-4 py-2 font-medium">Trạng thái</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {board.teams.flatMap((team) =>
                        team.members.map((member) => (
                            <tr key={member.id} className={cn(member.state === "OUT" && "text-gray-400")}>
                                <td className="px-4 py-2 font-medium">{member.name.split("(")[0].trim()}</td>
                                <td className="px-4 py-2">
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full" style={{backgroundColor: team.color}}/>
                                        {team.name}
                                    </span>
                                </td>
                                <td className="px-4 py-2">{member.openedAt ? localTimeLabel(new Date(member.openedAt), board.policy) : "—"}</td>
                                <td className="px-4 py-2">
                                    {member.lastCheckOutAt ? localTimeLabel(new Date(member.lastCheckOutAt), board.policy) : "—"}
                                </td>
                                <td className="px-4 py-2 text-right">{formatDuration(member.workedMinutes)}</td>
                                <td className="px-4 py-2 text-right font-medium text-warning">
                                    {member.otMinutes > 0 ? formatDuration(member.otMinutes) : "—"}
                                </td>
                                <td className="px-4 py-2"><StatusBadges statuses={member.statuses}/></td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

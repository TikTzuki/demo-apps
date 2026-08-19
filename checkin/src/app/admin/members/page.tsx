"use client";

import {useCallback, useEffect, useState} from "react";
import {Plus, Trash2} from "lucide-react";
import {Button} from "@/components/ui/button";
import {RosterImport} from "@/components/admin/RosterImport";
import {apiFetch} from "@/lib/api-client";
import {cn} from "@/lib/utils";
import type {Team} from "@/lib/types";

const EMPTY_MEMBER = {name: "", email: "", employeeCode: ""};

export default function AdminMembersPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [newTeamName, setNewTeamName] = useState("");
    const [draft, setDraft] = useState<Record<string, typeof EMPTY_MEMBER>>({});

    const load = useCallback(async () => {
        const result = await apiFetch<Team[]>("/api/admin/teams");
        setIsLoading(false);
        if (!result.success || !result.data) {
            setError(result.error ?? "Không thể tải danh sách");
            return;
        }
        setError(null);
        setTeams(result.data);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const report = (result: {success: boolean; error?: string; message?: string}) => {
        setError(result.success ? null : result.error ?? "Thao tác thất bại");
        setNotice(result.success ? result.message ?? null : null);
        if (result.success) load();
    };

    const addTeam = async () => {
        if (!newTeamName.trim()) return;
        report(await apiFetch("/api/admin/teams", {method: "POST", json: {name: newTeamName}}));
        setNewTeamName("");
    };

    const addMember = async (teamId: string) => {
        const values = draft[teamId] ?? EMPTY_MEMBER;
        if (!values.name.trim()) return;
        report(await apiFetch("/api/admin/members", {method: "POST", json: {...values, teamId}}));
        setDraft((prev) => ({...prev, [teamId]: EMPTY_MEMBER}));
    };

    const toggleActive = async (memberId: string, isActive: boolean) => {
        report(await apiFetch(`/api/admin/members/${memberId}`, {method: "PATCH", json: {isActive}}));
    };

    const removeMember = async (memberId: string, name: string) => {
        if (!window.confirm(`Xoá ${name}? Nếu đã có dữ liệu chấm công, nhân viên sẽ được vô hiệu hoá thay vì xoá.`)) {
            return;
        }
        report(await apiFetch(`/api/admin/members/${memberId}`, {method: "DELETE"}));
    };

    const removeTeam = async (teamId: string, name: string) => {
        if (!window.confirm(`Xoá đội ${name}?`)) return;
        report(await apiFetch(`/api/admin/teams/${teamId}`, {method: "DELETE"}));
    };

    const setField = (teamId: string, field: keyof typeof EMPTY_MEMBER, value: string) =>
        setDraft((prev) => ({...prev, [teamId]: {...(prev[teamId] ?? EMPTY_MEMBER), [field]: value}}));

    if (isLoading) return <p className="text-gray-500">Đang tải...</p>;

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-bold text-gray-800">Nhân sự</h1>

            {error && <div className="bg-danger/10 text-danger rounded-xl p-3 text-sm">{error}</div>}
            {notice && <div className="bg-success/10 text-success rounded-xl p-3 text-sm">{notice}</div>}

            <RosterImport onImported={load}/>

            <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-wrap gap-2 items-end">
                <label className="flex-1 min-w-[200px] text-sm">
                    <span className="text-gray-500 block">Tên đội mới</span>
                    <input
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        placeholder="VD: Phòng Kỹ thuật"
                        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-primary focus:outline-none"
                    />
                </label>
                <Button variant="primary" size="sm" onClick={addTeam}>
                    <Plus size={15} className="mr-1"/> Thêm đội
                </Button>
            </div>

            {teams.map((team) => {
                const values = draft[team.id] ?? EMPTY_MEMBER;
                return (
                    <div key={team.id} className="bg-white rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full" style={{backgroundColor: team.color}}/>
                                <h2 className="font-semibold text-gray-800">{team.name}</h2>
                                <span className="text-gray-400 text-sm">({team.members.length})</span>
                            </div>
                            <button
                                onClick={() => removeTeam(team.id, team.name)}
                                className="text-gray-400 hover:text-danger p-1"
                                title="Xoá đội"
                            >
                                <Trash2 size={16}/>
                            </button>
                        </div>

                        <div className="divide-y divide-gray-100 mb-3">
                            {team.members.map((member) => (
                                <div key={member.id} className="flex items-center gap-3 py-2">
                                    <div className="flex-1 min-w-0">
                                        <p className={cn("font-medium truncate", !member.isActive && "text-gray-400 line-through")}>
                                            {member.name}
                                        </p>
                                        <p className="text-gray-400 text-xs truncate">
                                            {[member.employeeCode, member.email].filter(Boolean).join(" · ") || "—"}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => toggleActive(member.id, !member.isActive)}
                                        className={cn(
                                            "rounded-full px-2.5 py-1 text-xs font-medium",
                                            member.isActive
                                                ? "bg-success/10 text-success"
                                                : "bg-gray-100 text-gray-500"
                                        )}
                                    >
                                        {member.isActive ? "Đang làm" : "Đã nghỉ"}
                                    </button>
                                    <button
                                        onClick={() => removeMember(member.id, member.name)}
                                        className="text-gray-300 hover:text-danger p-1"
                                    >
                                        <Trash2 size={15}/>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-2 items-end border-t border-gray-100 pt-3">
                            <input
                                value={values.name}
                                onChange={(e) => setField(team.id, "name", e.target.value)}
                                placeholder="Họ tên *"
                                className="flex-1 min-w-[160px] rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                            />
                            <input
                                value={values.employeeCode}
                                onChange={(e) => setField(team.id, "employeeCode", e.target.value)}
                                placeholder="Mã NV"
                                className="w-28 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                            />
                            <input
                                value={values.email}
                                onChange={(e) => setField(team.id, "email", e.target.value)}
                                placeholder="Email"
                                className="flex-1 min-w-[160px] rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                            />
                            <Button variant="ghost" size="sm" className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    onClick={() => addMember(team.id)}>
                                <Plus size={15} className="mr-1"/> Thêm
                            </Button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

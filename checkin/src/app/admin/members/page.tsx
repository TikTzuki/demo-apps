"use client";

import {useCallback, useEffect, useState} from "react";
import {Trash2, UserPlus} from "lucide-react";
import {Alert, Button, EmptyState, inputClass, Panel} from "@/components/admin/Ui";
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

    if (isLoading) return <Panel><div className="p-4"><div className="h-2.5 w-40 rounded-full bg-zinc-100 animate-pulse"/></div></Panel>;

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Nhân sự</h1>

            {error && <Alert tone="danger">{error}</Alert>}
            {notice && <Alert tone="success">{notice}</Alert>}

            <RosterImport onImported={load}/>

            <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-wrap gap-2 items-end">
                <label className="flex-1 min-w-[200px] text-sm">
                    <span className="text-zinc-500 block">Tên đội mới</span>
                    <input
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        placeholder="VD: Phòng Kỹ thuật"
                        className={`${inputClass} mt-1 w-full`}
                    />
                </label>
                <Button variant="primary" onClick={addTeam}>Thêm đội</Button>
            </div>

            {teams.length === 0 && (
                <Panel>
                    <EmptyState
                        icon={<UserPlus size={26}/>}
                        title="Chưa có nhân viên nào"
                        body="Nhập tệp danh sách từ HR để tạo phòng ban và nhân viên cùng lúc, hoặc thêm từng người một."
                    />
                </Panel>
            )}

            {teams.map((team) => {
                const values = draft[team.id] ?? EMPTY_MEMBER;
                return (
                    <div key={team.id} className="bg-white border border-zinc-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full" style={{backgroundColor: team.color}}/>
                                <h2 className="font-semibold text-zinc-900">{team.name}</h2>
                                <span className="text-zinc-400 text-sm">({team.members.length})</span>
                            </div>
                            <button
                                onClick={() => removeTeam(team.id, team.name)}
                                className="text-zinc-400 hover:text-red-700 p-1"
                                title="Xoá đội"
                            >
                                <Trash2 size={16}/>
                            </button>
                        </div>

                        <div className="divide-y divide-zinc-100 mb-3">
                            {team.members.map((member) => (
                                <div key={member.id} className="flex items-center gap-3 py-2">
                                    <div className="flex-1 min-w-0">
                                        <p className={cn("font-medium truncate", !member.isActive && "text-zinc-400 line-through")}>
                                            {member.name}
                                        </p>
                                        <p className="text-zinc-400 text-xs truncate">
                                            {[member.employeeCode, member.email].filter(Boolean).join(" · ") || "—"}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => toggleActive(member.id, !member.isActive)}
                                        className={cn(
                                            "rounded-full px-2.5 py-1 text-xs font-medium",
                                            member.isActive
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-zinc-100 text-zinc-500"
                                        )}
                                    >
                                        {member.isActive ? "Đang làm" : "Đã nghỉ"}
                                    </button>
                                    <button
                                        onClick={() => removeMember(member.id, member.name)}
                                        className="text-zinc-300 hover:text-red-700 p-1"
                                    >
                                        <Trash2 size={15}/>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-2 items-end border-t border-zinc-200 pt-3">
                            <input
                                value={values.name}
                                onChange={(e) => setField(team.id, "name", e.target.value)}
                                placeholder="Họ tên *"
                                className={`${inputClass} flex-1 min-w-[160px]`}
                            />
                            <input
                                value={values.employeeCode}
                                onChange={(e) => setField(team.id, "employeeCode", e.target.value)}
                                placeholder="Mã NV"
                                className={`${inputClass} w-28`}
                            />
                            <input
                                value={values.email}
                                onChange={(e) => setField(team.id, "email", e.target.value)}
                                placeholder="Email"
                                className={`${inputClass} flex-1 min-w-[160px]`}
                            />
                            <Button onClick={() => addMember(team.id)}>Thêm</Button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

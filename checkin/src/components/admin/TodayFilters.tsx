"use client";

import {Search, X} from "lucide-react";
import {inputClass} from "@/components/admin/Ui";
import {cn} from "@/lib/utils";

export type TodayStatus = "WORKING" | "DONE" | "ABSENT" | "OT" | "REVIEW" | "MISSING";

export interface TodayFilterState {
    query: string;
    teamId: string;
    status: TodayStatus | null;
}

export const EMPTY_FILTERS: TodayFilterState = {query: "", teamId: "", status: null};

export function isFiltered(f: TodayFilterState): boolean {
    return f.query.trim() !== "" || f.teamId !== "" || f.status !== null;
}

interface TodayFiltersProps {
    filters: TodayFilterState;
    onChange: (next: TodayFilterState) => void;
    teams: { id: string; name: string; count: number }[];
    shown: number;
    total: number;
}

export function TodayFilters({filters, onChange, teams, shown, total}: TodayFiltersProps) {
    const active = isFiltered(filters);

    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"/>
                <input
                    value={filters.query}
                    onChange={(e) => onChange({...filters, query: e.target.value})}
                    placeholder="Tìm tên hoặc mã NV"
                    className={cn(inputClass, "w-64 pl-9")}
                />
            </div>

            <select
                value={filters.teamId}
                onChange={(e) => onChange({...filters, teamId: e.target.value})}
                className={cn(inputClass, "min-w-[190px]")}
            >
                <option value="">Tất cả phòng ban</option>
                {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.count})</option>
                ))}
            </select>

            <span className="text-sm text-zinc-500 tabular">
                {active ? <><strong className="text-zinc-900">{shown}</strong> / {total}</> : <>{total}</>} nhân viên
            </span>

            {active && (
                <button
                    onClick={() => onChange(EMPTY_FILTERS)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 h-10 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                    <X size={14}/> Xoá bộ lọc
                </button>
            )}
        </div>
    );
}

/**
 * The stat tiles double as the status filter.
 *
 * Counts always reflect the whole day, never the filtered view — otherwise
 * selecting one tile would zero the others and the numbers would stop meaning
 * anything.
 */
export function StatFilterTile({
                                   label, value, note, tone, status, filters, onChange,
                               }: {
    label: string;
    value: number;
    note: string;
    tone: string;
    status: TodayStatus;
    filters: TodayFilterState;
    onChange: (next: TodayFilterState) => void;
}) {
    const selected = filters.status === status;

    return (
        <button
            onClick={() => onChange({...filters, status: selected ? null : status})}
            aria-pressed={selected}
            className={cn(
                "bg-white border rounded-xl px-5 py-4 flex flex-col gap-2 text-left transition-all",
                selected ? "border-zinc-900 ring-1 ring-zinc-900" : "border-zinc-200 hover:border-zinc-300",
                value === 0 && !selected && "opacity-60"
            )}
        >
            <span className="text-xs uppercase tracking-wide text-zinc-500">{label}</span>
            <span className="flex items-baseline gap-2">
                <span className={cn("tabular text-3xl font-bold leading-none", tone)}>{value}</span>
                <span className="text-sm text-zinc-400">{selected ? "đang lọc" : note}</span>
            </span>
        </button>
    );
}

"use client";

import {useState} from "react";
import {
    setDepartmentSheet,
    clearDepartmentSheet,
    syncDepartmentSheet,
    type Department,
    type SheetSyncResult,
} from "@/lib/api";

interface Props {
    department: Department;
    onUpdated: (department: Department) => void;
    onSynced?: () => void;
}

function sheetUrlFromId(sheetId: string): string {
    return `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
}

function formatTime(value?: string | null): string {
    if (!value) return "never";
    return new Date(value).toLocaleString();
}

export default function SheetsSyncCard({department, onUpdated, onSynced}: Props) {
    const [urlInput, setUrlInput] = useState(department.sheet_id ?? "");
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<SheetSyncResult | null>(null);

    async function handleSave() {
        if (!urlInput.trim()) return;
        setSaving(true);
        setError(null);
        try {
            const updated = await setDepartmentSheet(department.id, urlInput.trim());
            onUpdated(updated);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to save sheet URL");
        } finally {
            setSaving(false);
        }
    }

    async function handleClear() {
        if (!confirm("Disconnect this department from its Google Sheet?")) return;
        setSaving(true);
        setError(null);
        try {
            const updated = await clearDepartmentSheet(department.id);
            setUrlInput("");
            setResult(null);
            onUpdated(updated);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to disconnect");
        } finally {
            setSaving(false);
        }
    }

    async function handleSync() {
        setSyncing(true);
        setError(null);
        setResult(null);
        try {
            const r = await syncDepartmentSheet(department.id);
            setResult(r);
            onUpdated({...department, last_synced_at: r.synced_at});
            if (r.status_updates_applied > 0) onSynced?.();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Sync failed");
        } finally {
            setSyncing(false);
        }
    }

    const connected = !!department.sheet_id;

    return (
        <div className="card mt-6 p-5">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900">
                        Google Sheets Sync
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                        Two-way sync of CV rows with a Google Sheet. Recruiters can change CV{" "}
                        <span className="font-medium">status</span> directly in the sheet
                        and changes flow back on the next sync (last-write-wins by
                        timestamp).
                    </p>
                </div>
                {connected && (
                    <a
                        href={sheetUrlFromId(department.sheet_id!)}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 text-xs font-medium text-indigo-600 hover:underline"
                    >
                        Open sheet ↗
                    </a>
                )}
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Paste Google Sheets URL or ID"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    disabled={saving || syncing}
                />
                <button
                    onClick={handleSave}
                    disabled={saving || syncing || !urlInput.trim()}
                    className="btn-secondary"
                >
                    {saving ? "Saving..." : connected ? "Update" : "Connect"}
                </button>
                {connected && (
                    <button
                        onClick={handleClear}
                        disabled={saving || syncing}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Disconnect
                    </button>
                )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-gray-500">
                    Last sync: <span className="font-medium text-gray-700">
                        {formatTime(department.last_synced_at)}
                    </span>
                </div>
                <button
                    onClick={handleSync}
                    disabled={!connected || syncing || saving}
                    className="btn-primary"
                >
                    {syncing ? "Syncing..." : "Sync now"}
                </button>
            </div>

            {error && (
                <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                </div>
            )}

            {result && (
                <div className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-800">
                    Pushed {result.rows_pushed} rows · Applied{" "}
                    {result.status_updates_applied} status change
                    {result.status_updates_applied === 1 ? "" : "s"} from sheet
                    {result.conflicts_skipped > 0 &&
                        ` · ${result.conflicts_skipped} conflict${result.conflicts_skipped === 1 ? "" : "s"} skipped`}
                    {result.invalid_status_values > 0 &&
                        ` · ${result.invalid_status_values} invalid value${result.invalid_status_values === 1 ? "" : "s"} ignored`}
                </div>
            )}
        </div>
    );
}

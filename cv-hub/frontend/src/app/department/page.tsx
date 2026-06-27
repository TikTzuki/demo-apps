"use client";

import {Suspense, useEffect, useState, useCallback} from "react";
import {useSearchParams} from "next/navigation";
import Link from "next/link";
import {
    getDepartments,
    getDepartmentCVs,
    getDepartmentJDs,
    deleteCV,
    deleteJD,
    updateCVStatus,
    getCVDownloadUrl,
    type Department,
    type CV,
    type JD,
} from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import CVUploadModal from "@/components/CVUploadModal";
import JDFormModal from "@/components/JDFormModal";
import SheetsSyncCard from "@/components/SheetsSyncCard";

type Tab = "cvs" | "jds";
type SortKey = "uploaded_at" | "review_score" | "best_match" | "status";
type SortDir = "asc" | "desc";

function DepartmentPageInner() {
    const searchParams = useSearchParams();
    const departmentId = Number(searchParams.get("id"));

    const [department, setDepartment] = useState<Department | null>(null);
    const [cvs, setCVs] = useState<CV[]>([]);
    const [jds, setJDs] = useState<JD[]>([]);
    const [activeTab, setActiveTab] = useState<Tab>("cvs");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "passed" | "failed">("all");
    const [sortKey, setSortKey] = useState<SortKey>("uploaded_at");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showJDModal, setShowJDModal] = useState(false);
    const [editingJD, setEditingJD] = useState<JD | null>(null);

    const loadData = useCallback(async () => {
        try {
            const [depts, cvList, jdList] = await Promise.all([
                getDepartments(),
                getDepartmentCVs(departmentId),
                getDepartmentJDs(departmentId),
            ]);
            const dept = depts.find((d) => d.id === departmentId) || null;
            setDepartment(dept);
            setCVs(cvList);
            setJDs(jdList);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load data");
        } finally {
            setLoading(false);
        }
    }, [departmentId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    async function handleDeleteCV(cvId: number) {
        if (!confirm("Are you sure you want to delete this CV?")) return;
        try {
            await deleteCV(cvId);
            setCVs((prev) => prev.filter((c) => c.id !== cvId));
        } catch {
            alert("Failed to delete CV");
        }
    }

    async function handleDeleteJD(jdId: number) {
        if (!confirm("Are you sure you want to delete this job description?"))
            return;
        try {
            await deleteJD(jdId);
            setJDs((prev) => prev.filter((j) => j.id !== jdId));
        } catch {
            alert("Failed to delete job description");
        }
    }

    async function handleStatusChange(cvId: number, status: "pending" | "passed" | "failed") {
        try {
            const updated = await updateCVStatus(cvId, status);
            setCVs((prev) => prev.map((c) => (c.id === cvId ? {...c, status: updated.status} : c)));
        } catch {
            alert("Failed to update status");
        }
    }

    function toggleSort(key: SortKey) {
        if (sortKey === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("desc");
        }
    }

    const statusOrder = {passed: 2, pending: 1, failed: 0};

    const filteredCVs = (statusFilter === "all" ? cvs : cvs.filter((c) => c.status === statusFilter))
        .slice()
        .sort((a, b) => {
            let av: number, bv: number;
            switch (sortKey) {
                case "uploaded_at":
                    av = new Date(a.uploaded_at).getTime();
                    bv = new Date(b.uploaded_at).getTime();
                    break;
                case "review_score":
                    av = a.review_score ?? -1;
                    bv = b.review_score ?? -1;
                    break;
                case "best_match":
                    av = a.best_match_percentage ?? -1;
                    bv = b.best_match_percentage ?? -1;
                    break;
                case "status":
                    av = statusOrder[a.status] ?? 0;
                    bv = statusOrder[b.status] ?? 0;
                    break;
                default:
                    return 0;
            }
            return sortDir === "asc" ? av - bv : bv - av;
        });

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <LoadingSpinner size="lg" label="Loading department..."/>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Link href="/" className="hover:text-indigo-600">
                            Dashboard
                        </Link>
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m8.25 4.5 7.5 7.5-7.5 7.5"
                            />
                        </svg>
                        <span className="text-gray-700">
              {department?.name || "Department"}
            </span>
                    </div>
                    <h1 className="mt-2 text-2xl font-bold text-gray-900">
                        {department?.name || "Department"}
                    </h1>
                    {department?.description && (
                        <p className="mt-1 text-sm text-gray-500">
                            {department.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Google Sheets Sync */}
            {department && (
                <SheetsSyncCard
                    department={department}
                    onUpdated={(d) => setDepartment(d)}
                    onSynced={loadData}
                />
            )}

            {/* Tabs */}
            <div className="mt-6 border-b border-gray-200">
                <nav className="-mb-px flex gap-6">
                    <button
                        onClick={() => setActiveTab("cvs")}
                        className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                            activeTab === "cvs"
                                ? "border-indigo-600 text-indigo-600"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                        }`}
                    >
                        CVs
                        <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {cvs.length}
            </span>
                    </button>
                    <button
                        onClick={() => setActiveTab("jds")}
                        className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                            activeTab === "jds"
                                ? "border-indigo-600 text-indigo-600"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                        }`}
                    >
                        Job Descriptions
                        <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {jds.length}
            </span>
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === "cvs" && (
                    <div>
                        {/* Toolbar: filter + upload */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {(["all", "pending", "passed", "failed"] as const).map((s) => {
                                    const counts = {
                                        all: cvs.length,
                                        pending: cvs.filter((c) => c.status === "pending").length,
                                        passed: cvs.filter((c) => c.status === "passed").length,
                                        failed: cvs.filter((c) => c.status === "failed").length,
                                    };
                                    const labels = {all: "All", pending: "Pending", passed: "Passed", failed: "Failed"};
                                    const colors = {
                                        all: statusFilter === "all" ? "bg-indigo-100 text-indigo-700 border-indigo-300" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50",
                                        pending: statusFilter === "pending" ? "bg-gray-200 text-gray-800 border-gray-400" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50",
                                        passed: statusFilter === "passed" ? "bg-green-100 text-green-700 border-green-300" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50",
                                        failed: statusFilter === "failed" ? "bg-red-100 text-red-700 border-red-300" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50",
                                    };
                                    return (
                                        <button
                                            key={s}
                                            onClick={() => setStatusFilter(s)}
                                            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${colors[s]}`}
                                        >
                                            {labels[s]} ({counts[s]})
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="btn-primary"
                            >
                                <svg
                                    className="-ml-0.5 mr-1.5 h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                                    />
                                </svg>
                                Upload CV
                            </button>
                        </div>

                        {/* CV List */}
                        {filteredCVs.length === 0 ? (
                            <div
                                className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center">
                                <svg
                                    className="h-12 w-12 text-gray-300"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                                    />
                                </svg>
                                <h3 className="mt-3 text-sm font-semibold text-gray-900">
                                    {statusFilter === "all" ? "No CVs uploaded" : `No ${statusFilter} CVs`}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {statusFilter === "all"
                                        ? "Upload a PDF to get started with AI-powered reviews."
                                        : "No CVs match this filter."}
                                </p>
                            </div>
                        ) : (
                            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Filename
                                        </th>
                                        <th
                                            onClick={() => toggleSort("uploaded_at")}
                                            className="cursor-pointer select-none px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700"
                                        >
                        <span className="inline-flex items-center gap-1">
                          Upload Date
                            {sortKey === "uploaded_at" && (sortDir === "desc" ? " ↓" : " ↑")}
                        </span>
                                        </th>
                                        <th
                                            onClick={() => toggleSort("review_score")}
                                            className="cursor-pointer select-none px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700"
                                        >
                        <span className="inline-flex items-center gap-1">
                          Review
                            {sortKey === "review_score" && (sortDir === "desc" ? " ↓" : " ↑")}
                        </span>
                                        </th>
                                        <th
                                            onClick={() => toggleSort("best_match")}
                                            className="cursor-pointer select-none px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700"
                                        >
                        <span className="inline-flex items-center gap-1">
                          Best Match
                            {sortKey === "best_match" && (sortDir === "desc" ? " ↓" : " ↑")}
                        </span>
                                        </th>
                                        <th
                                            onClick={() => toggleSort("status")}
                                            className="cursor-pointer select-none px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700"
                                        >
                        <span className="inline-flex items-center gap-1">
                          Status
                            {sortKey === "status" && (sortDir === "desc" ? " ↓" : " ↑")}
                        </span>
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Actions
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                    {filteredCVs.map((cv) => (
                                        <tr
                                            key={cv.id}
                                            className="transition-colors hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4">
                                                <Link
                                                    href={`/cv?dept=${departmentId}&id=${cv.id}`}
                                                    className="flex items-center gap-3 text-sm font-medium text-gray-900 hover:text-indigo-600"
                                                >
                                                    <svg
                                                        className="h-8 w-8 shrink-0 text-red-400"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={1.5}
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                                                        />
                                                    </svg>
                                                    <span className="truncate max-w-xs">
                              {cv.original_filename}
                            </span>
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 text-center text-xs text-gray-500 whitespace-nowrap">
                                                {formatDate(cv.uploaded_at)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {cv.review_score != null ? (
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                                            cv.review_score >= 7 ? "bg-green-100 text-green-700" :
                                                                cv.review_score >= 4 ? "bg-yellow-100 text-yellow-700" :
                                                                    "bg-red-100 text-red-700"
                                                        }`}>
                              {cv.review_score}/10
                            </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">--</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {cv.best_match_percentage != null ? (
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                                            cv.best_match_percentage >= 70 ? "bg-green-100 text-green-700" :
                                                                cv.best_match_percentage >= 40 ? "bg-yellow-100 text-yellow-700" :
                                                                    "bg-red-100 text-red-700"
                                                        }`}>
                              {cv.best_match_percentage}%
                            </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">--</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => handleStatusChange(cv.id, "passed")}
                                                        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                                                            cv.status === "passed"
                                                                ? "bg-green-500 text-white"
                                                                : "bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700"
                                                        }`}
                                                        title="Mark as Passed"
                                                    >
                                                        Pass
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusChange(cv.id, "failed")}
                                                        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                                                            cv.status === "failed"
                                                                ? "bg-red-500 text-white"
                                                                : "bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-700"
                                                        }`}
                                                        title="Mark as Failed"
                                                    >
                                                        Fail
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/cv?dept=${departmentId}&id=${cv.id}`}
                                                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-indigo-600"
                                                        title="View"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24"
                                                             strokeWidth={1.5} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                                  d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/>
                                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                                                        </svg>
                                                    </Link>
                                                    <a
                                                        href={getCVDownloadUrl(cv.id)}
                                                        download={cv.original_filename}
                                                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-green-600"
                                                        title="Download"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24"
                                                             strokeWidth={1.5} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                                                        </svg>
                                                    </a>
                                                    <button
                                                        onClick={() => handleDeleteCV(cv.id)}
                                                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                                        title="Delete"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24"
                                                             strokeWidth={1.5} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "jds" && (
                    <div>
                        {/* Create button */}
                        <div className="flex justify-end">
                            <button
                                onClick={() => {
                                    setEditingJD(null);
                                    setShowJDModal(true);
                                }}
                                className="btn-primary"
                            >
                                <svg
                                    className="-ml-0.5 mr-1.5 h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 4.5v15m7.5-7.5h-15"
                                    />
                                </svg>
                                New Job Description
                            </button>
                        </div>

                        {/* JD List */}
                        {jds.length === 0 ? (
                            <div
                                className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center">
                                <svg
                                    className="h-12 w-12 text-gray-300"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z"
                                    />
                                </svg>
                                <h3 className="mt-3 text-sm font-semibold text-gray-900">
                                    No job descriptions
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Create a job description to start matching CVs.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-4 space-y-3">
                                {jds.map((jd) => (
                                    <div
                                        key={jd.id}
                                        className="card flex items-center justify-between p-5 transition-shadow hover:shadow-md"
                                    >
                                        <div
                                            className="min-w-0 flex-1 cursor-pointer"
                                            onClick={() => {
                                                setEditingJD(jd);
                                                setShowJDModal(true);
                                            }}
                                        >
                                            <h4 className="text-sm font-semibold text-gray-900">
                                                {jd.title}
                                            </h4>
                                            {jd.description && (
                                                <p className="mt-1 truncate text-sm text-gray-500">
                                                    {jd.description}
                                                </p>
                                            )}
                                            <p className="mt-1 text-xs text-gray-400">
                                                Created {formatDate(jd.created_at)}
                                            </p>
                                        </div>
                                        <div className="ml-4 flex shrink-0 items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingJD(jd);
                                                    setShowJDModal(true);
                                                }}
                                                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-indigo-600"
                                                title="Edit"
                                            >
                                                <svg
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={1.5}
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                                                    />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteJD(jd.id)}
                                                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                                title="Delete"
                                            >
                                                <svg
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={1.5}
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            {showUploadModal && (
                <CVUploadModal
                    departmentId={departmentId}
                    onClose={() => setShowUploadModal(false)}
                    onUploaded={(cv) => {
                        setCVs((prev) => [cv, ...prev]);
                        setShowUploadModal(false);
                    }}
                />
            )}

            {showJDModal && (
                <JDFormModal
                    departmentId={departmentId}
                    existingJD={editingJD}
                    onClose={() => {
                        setShowJDModal(false);
                        setEditingJD(null);
                    }}
                    onSaved={(jd) => {
                        if (editingJD) {
                            setJDs((prev) =>
                                prev.map((j) => (j.id === jd.id ? jd : j))
                            );
                        } else {
                            setJDs((prev) => [jd, ...prev]);
                        }
                        setShowJDModal(false);
                        setEditingJD(null);
                    }}
                />
            )}
        </div>
    );
}

export default function DepartmentPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-[60vh] items-center justify-center">
                    <LoadingSpinner size="lg" label="Loading department..."/>
                </div>
            }
        >
            <DepartmentPageInner/>
        </Suspense>
    );
}

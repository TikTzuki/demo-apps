"use client";

import {useEffect, useState, useCallback} from "react";
import Link from "next/link";
import {
    getAllJDs,
    getDepartments,
    deleteJD,
    type JD,
    type Department,
} from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import JDFormModal from "@/components/JDFormModal";

export default function JDManagementPage() {
    const [jds, setJDs] = useState<JD[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [editingJD, setEditingJD] = useState<JD | null>(null);
    const [filterDeptId, setFilterDeptId] = useState<number | "all">("all");

    const loadData = useCallback(async () => {
        try {
            const [jdList, deptList] = await Promise.all([
                getAllJDs(),
                getDepartments(),
            ]);
            setJDs(jdList);
            setDepartments(deptList);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    async function handleDelete(jdId: number) {
        if (!confirm("Are you sure you want to delete this job description?"))
            return;
        try {
            await deleteJD(jdId);
            setJDs((prev) => prev.filter((j) => j.id !== jdId));
        } catch {
            alert("Failed to delete job description");
        }
    }

    function getDeptName(deptId: number): string {
        return departments.find((d) => d.id === deptId)?.name || "Unknown";
    }

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    const filteredJDs =
        filterDeptId === "all"
            ? jds
            : jds.filter((j) => j.department_id === filterDeptId);

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <LoadingSpinner size="lg" label="Loading job descriptions..."/>
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
                    <h1 className="text-2xl font-bold text-gray-900">
                        Job Descriptions
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage job descriptions across all departments
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingJD(null);
                        setShowModal(true);
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
                    New JD
                </button>
            </div>

            {/* Filter */}
            <div className="mt-6 flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">
                    Department:
                </label>
                <select
                    value={filterDeptId}
                    onChange={(e) =>
                        setFilterDeptId(
                            e.target.value === "all" ? "all" : Number(e.target.value)
                        )
                    }
                    className="input-field w-auto"
                >
                    <option value="all">All ({jds.length})</option>
                    {departments.map((dept) => {
                        const count = jds.filter(
                            (j) => j.department_id === dept.id
                        ).length;
                        return (
                            <option key={dept.id} value={dept.id}>
                                {dept.name} ({count})
                            </option>
                        );
                    })}
                </select>
            </div>

            {/* JD List */}
            {filteredJDs.length === 0 ? (
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
                <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Title
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Department
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Created
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                        {filteredJDs.map((jd) => (
                            <tr
                                key={jd.id}
                                className="transition-colors hover:bg-gray-50"
                            >
                                <td className="px-6 py-4">
                                    <Link
                                        href={`/jd?id=${jd.id}`}
                                        className="block max-w-md hover:text-indigo-600"
                                    >
                                        <p className="text-sm font-medium text-gray-900 hover:text-indigo-600">
                                            {jd.title}
                                        </p>
                                        {jd.description && (
                                            <p className="mt-0.5 truncate text-sm text-gray-500">
                                                {jd.description}
                                            </p>
                                        )}
                                    </Link>
                                </td>
                                <td className="px-6 py-4">
                                    <Link
                                        href={`/department?id=${jd.department_id}`}
                                        className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                                    >
                                        {getDeptName(jd.department_id)}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {formatDate(jd.created_at)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link
                                            href={`/jd?id=${jd.id}`}
                                            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-indigo-600"
                                            title="View"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                                                 stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round"
                                                      d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/>
                                                <path strokeLinecap="round" strokeLinejoin="round"
                                                      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                                            </svg>
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setEditingJD(jd);
                                                setShowModal(true);
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
                                            onClick={() => handleDelete(jd.id)}
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
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <JDFormModal
                    departments={departments}
                    existingJD={editingJD}
                    onClose={() => {
                        setShowModal(false);
                        setEditingJD(null);
                    }}
                    onSaved={(jd) => {
                        if (editingJD) {
                            setJDs((prev) => prev.map((j) => (j.id === jd.id ? jd : j)));
                        } else {
                            setJDs((prev) => [jd, ...prev]);
                        }
                        setShowModal(false);
                        setEditingJD(null);
                    }}
                />
            )}
        </div>
    );
}

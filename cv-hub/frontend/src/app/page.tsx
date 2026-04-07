"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import {getDepartments, type Department} from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function DashboardPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getDepartments()
            .then(setDepartments)
            .catch((err) =>
                setError(err instanceof Error ? err.message : "Failed to load")
            )
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <LoadingSpinner size="lg" label="Loading departments..."/>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Overview of all departments and their CV pipelines.
                </p>
            </div>

            {error && (
                <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Department Cards */}
            {departments.length === 0 && !error ? (
                <div className="mt-12 flex flex-col items-center justify-center text-center">
                    <svg
                        className="h-16 w-16 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21"
                        />
                    </svg>
                    <h3 className="mt-4 text-sm font-semibold text-gray-900">
                        No departments
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Departments will appear here once they are created.
                    </p>
                </div>
            ) : (
                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {departments.map((dept) => (
                        <Link
                            key={dept.id}
                            href={`/departments/${dept.id}`}
                            className="card group relative overflow-hidden p-6 transition-all hover:shadow-md hover:ring-2 hover:ring-indigo-500/20"
                        >
                            {/* Accent bar */}
                            <div
                                className="absolute left-0 top-0 h-full w-1 bg-indigo-600 opacity-0 transition-opacity group-hover:opacity-100"/>

                            <div className="flex items-start justify-between">
                                <div
                                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                    <svg
                                        className="h-6 w-6"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21"
                                        />
                                    </svg>
                                </div>
                                <svg
                                    className="h-5 w-5 text-gray-300 transition-colors group-hover:text-indigo-500"
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
                            </div>

                            <h3 className="mt-4 text-lg font-semibold text-gray-900">
                                {dept.name}
                            </h3>
                            {dept.description && (
                                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                                    {dept.description}
                                </p>
                            )}

                            <div className="mt-4 flex items-center gap-2">
                <span
                    className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                  <svg
                      className="h-4 w-4 text-gray-400"
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
                    {dept.cv_count ?? 0} CVs
                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

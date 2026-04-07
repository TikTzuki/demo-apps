"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {getDepartments, clearAdminKey, type Department} from "@/lib/api";

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);

    function handleLogout() {
        clearAdminKey();
        router.push("/login");
    }

    useEffect(() => {
        getDepartments()
            .then(setDepartments)
            .catch(() => setDepartments([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-gray-200 bg-white">
            {/* Logo */}
            <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-gray-200 px-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                    <svg
                        className="h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                        />
                    </svg>
                </div>
                <span className="text-lg font-bold text-gray-900">CV Hub</span>
            </div>

            {/* Navigation */}
            <nav className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
                <div className="space-y-1">
                    <Link
                        href="/"
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            pathname === "/"
                                ? "bg-indigo-50 text-indigo-700"
                                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                    >
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                            />
                        </svg>
                        Dashboard
                    </Link>
                    <Link
                        href="/jds"
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            pathname === "/jds"
                                ? "bg-indigo-50 text-indigo-700"
                                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                    >
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z"
                            />
                        </svg>
                        Job Descriptions
                    </Link>
                </div>

                <div className="mt-6">
                    <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Departments
                    </p>
                    <div className="mt-2 space-y-1">
                        {loading ? (
                            <div className="flex items-center gap-2 px-3 py-2">
                                <div
                                    className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600"/>
                                <span className="text-sm text-gray-400">Loading...</span>
                            </div>
                        ) : departments.length === 0 ? (
                            <p className="px-3 py-2 text-sm text-gray-400">
                                No departments yet
                            </p>
                        ) : (
                            departments.map((dept) => {
                                const isActive = pathname.startsWith(
                                    `/departments/${dept.id}`
                                );
                                return (
                                    <Link
                                        key={dept.id}
                                        href={`/departments/${dept.id}`}
                                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                            isActive
                                                ? "bg-indigo-50 text-indigo-700"
                                                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                        }`}
                                    >
                                        <svg
                                            className="h-5 w-5"
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
                                        <span className="truncate">{dept.name}</span>
                                        {dept.cv_count !== undefined && (
                                            <span
                                                className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-100 px-1.5 text-xs font-medium text-gray-600">
                        {dept.cv_count}
                      </span>
                                        )}
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>
            </nav>

            {/* Footer */}
            <div className="border-t border-gray-200 px-4 py-4">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                    <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                        />
                    </svg>
                    Logout
                </button>
            </div>
        </aside>
    );
}

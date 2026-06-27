"use client";

import {Suspense, useEffect, useState} from "react";
import {useSearchParams} from "next/navigation";
import Link from "next/link";
import {
    getCV,
    getDepartments,
    getCVFileUrl,
    updateCVStatus,
    type CV,
    type Department,
} from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import ReviewSection from "@/components/ReviewSection";
import MatchSection from "@/components/MatchSection";

function CVDetailPageInner() {
    const searchParams = useSearchParams();
    const departmentId = Number(searchParams.get("dept"));
    const cvId = Number(searchParams.get("id"));

    const [cv, setCV] = useState<CV | null>(null);
    const [department, setDepartment] = useState<Department | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([getCV(cvId), getDepartments()])
            .then(([cvData, depts]) => {
                setCV(cvData);
                setDepartment(
                    depts.find((d) => d.id === departmentId) || null
                );
            })
            .catch((err) =>
                setError(err instanceof Error ? err.message : "Failed to load CV")
            )
            .finally(() => setLoading(false));
    }, [cvId, departmentId]);

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <LoadingSpinner size="lg" label="Loading CV details..."/>
            </div>
        );
    }

    if (error || !cv) {
        return (
            <div className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error || "CV not found"}
            </div>
        );
    }

    return (
        <div>
            {/* Breadcrumb */}
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
                <Link
                    href={`/department?id=${departmentId}`}
                    className="hover:text-indigo-600"
                >
                    {department?.name || "Department"}
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
                <span className="truncate text-gray-700">{cv.original_filename}</span>
            </div>

            {/* Header */}
            <div className="mt-4 flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">{cv.original_filename}</h1>
                        {cv.status === "passed" && <span
                            className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">Passed</span>}
                        {cv.status === "failed" && <span
                            className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">Failed</span>}
                        {cv.status === "pending" && <span
                            className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">Pending</span>}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <button
                            onClick={async () => {
                                const u = await updateCVStatus(cvId, "passed");
                                setCV((p) => p ? {...p, status: u.status} : p);
                            }}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${cv.status === "passed" ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700"}`}
                        >
                            Pass
                        </button>
                        <button
                            onClick={async () => {
                                const u = await updateCVStatus(cvId, "failed");
                                setCV((p) => p ? {...p, status: u.status} : p);
                            }}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${cv.status === "failed" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-700"}`}
                        >
                            Fail
                        </button>
                        {cv.status !== "pending" && (
                            <button
                                onClick={async () => {
                                    const u = await updateCVStatus(cvId, "pending");
                                    setCV((p) => p ? {...p, status: u.status} : p);
                                }}
                                className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
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
                    d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21"
                />
              </svg>
                {department?.name || `Department ${departmentId}`}
            </span>
                        <span className="flex items-center gap-1.5">
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
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                />
              </svg>
                            {formatDate(cv.uploaded_at)}
            </span>
                    </div>
                </div>
                <Link
                    href={`/department?id=${departmentId}`}
                    className="btn-secondary"
                >
                    <svg
                        className="-ml-0.5 mr-1.5 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
                        />
                    </svg>
                    Back
                </Link>
            </div>

            {/* Content */}
            <div className="mt-6 space-y-6">
                {/* PDF Viewer */}
                <div className="card overflow-hidden">
                    <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                        <h3 className="text-sm font-semibold text-gray-700">
                            CV Preview
                        </h3>
                    </div>
                    <iframe
                        src={getCVFileUrl(cvId) + "#toolbar=1&view=FitH"}
                        className="w-full"
                        style={{height: "80vh"}}
                        title="CV Preview"
                    />
                </div>

                {/* Review + Match */}
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <ReviewSection cvId={cvId} initialReview={cv.review}/>
                    <MatchSection cvId={cvId} departmentId={departmentId}/>
                </div>
            </div>
        </div>
    );
}

export default function CVDetailPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-[60vh] items-center justify-center">
                    <LoadingSpinner size="lg" label="Loading CV details..."/>
                </div>
            }
        >
            <CVDetailPageInner/>
        </Suspense>
    );
}

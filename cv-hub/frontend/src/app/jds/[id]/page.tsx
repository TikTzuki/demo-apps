"use client";

import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import Link from "next/link";
import {
    getJD,
    getDepartments,
    updateJD,
    deleteJD,
    type JD,
    type Department,
} from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function JDDetailPage() {
    const params = useParams();
    const router = useRouter();
    const jdId = Number(params.id);

    const [jd, setJD] = useState<JD | null>(null);
    const [department, setDepartment] = useState<Department | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [editing, setEditing] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editRequirements, setEditRequirements] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        Promise.all([getJD(jdId), getDepartments()])
            .then(([jdData, depts]) => {
                setJD(jdData);
                setDepartment(
                    depts.find((d) => d.id === jdData.department_id) || null
                );
                setEditTitle(jdData.title);
                setEditDescription(jdData.description);
                setEditRequirements(jdData.requirements);
            })
            .catch((err) =>
                setError(err instanceof Error ? err.message : "Failed to load")
            )
            .finally(() => setLoading(false));
    }, [jdId]);

    async function handleSave() {
        setSaving(true);
        try {
            const updated = await updateJD(jdId, {
                title: editTitle,
                description: editDescription,
                requirements: editRequirements,
            });
            setJD(updated);
            setEditing(false);
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!confirm("Are you sure you want to delete this job description?"))
            return;
        try {
            await deleteJD(jdId);
            router.push("/jds");
        } catch {
            alert("Failed to delete");
        }
    }

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
                <LoadingSpinner size="lg" label="Loading job description..."/>
            </div>
        );
    }

    if (error || !jd) {
        return (
            <div className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error || "Job description not found"}
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
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
                </svg>
                <Link href="/jds" className="hover:text-indigo-600">
                    Job Descriptions
                </Link>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
                </svg>
                <span className="truncate text-gray-700">{jd.title}</span>
            </div>

            {/* Header */}
            <div className="mt-4 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{jd.title}</h1>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                        <Link
                            href={`/departments/${jd.department_id}`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                                 stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21"/>
                            </svg>
                            {department?.name || "Department"}
                        </Link>
                        <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/>
              </svg>
              Created {formatDate(jd.created_at)}
            </span>
                        {jd.updated_at && jd.updated_at !== jd.created_at && (
                            <span className="text-gray-400">
                Updated {formatDate(jd.updated_at)}
              </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!editing && (
                        <>
                            <button
                                onClick={() => setEditing(true)}
                                className="btn-secondary"
                            >
                                <svg className="-ml-0.5 mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24"
                                     strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/>
                                </svg>
                                Edit
                            </button>
                            <button
                                onClick={handleDelete}
                                className="btn-secondary text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                                <svg className="-ml-0.5 mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24"
                                     strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
                                </svg>
                                Delete
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="mt-6 space-y-6">
                {editing ? (
                    /* Edit mode */
                    <div className="card space-y-5 p-6">
                        <div>
                            <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="edit-title"
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="input-field mt-1 w-full"
                            />
                        </div>
                        <div>
                            <label htmlFor="edit-desc" className="block text-sm font-medium text-gray-700">
                                Description
                            </label>
                            <textarea
                                id="edit-desc"
                                rows={6}
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                className="textarea-field mt-1 w-full"
                            />
                        </div>
                        <div>
                            <label htmlFor="edit-req" className="block text-sm font-medium text-gray-700">
                                Requirements
                            </label>
                            <textarea
                                id="edit-req"
                                rows={8}
                                value={editRequirements}
                                onChange={(e) => setEditRequirements(e.target.value)}
                                className="textarea-field mt-1 w-full"
                            />
                        </div>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => {
                                    setEditing(false);
                                    setEditTitle(jd.title);
                                    setEditDescription(jd.description);
                                    setEditRequirements(jd.requirements);
                                }}
                                disabled={saving}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !editTitle.trim()}
                                className="btn-primary disabled:opacity-50"
                            >
                                {saving ? (
                                    <span className="flex items-center gap-2">
                    <LoadingSpinner size="sm"/>
                    Saving...
                  </span>
                                ) : (
                                    "Save Changes"
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* View mode */
                    <>
                        {/* Description */}
                        <div className="card p-6">
                            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                                     stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                          d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
                                </svg>
                                Description
                            </h3>
                            <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                                {jd.description ||
                                    <span className="italic text-gray-400">No description provided</span>}
                            </div>
                        </div>

                        {/* Requirements */}
                        <div className="card p-6">
                            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                                     stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                          d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"/>
                                </svg>
                                Requirements
                            </h3>
                            <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                                {jd.requirements ||
                                    <span className="italic text-gray-400">No requirements provided</span>}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

"use client";

import {useState, useEffect} from "react";
import {createJD, updateJD, type JD, type Department} from "@/lib/api";
import LoadingSpinner from "./LoadingSpinner";

interface JDFormModalProps {
    departmentId?: number;
    departments?: Department[];
    existingJD?: JD | null;
    onClose: () => void;
    onSaved: (jd: JD) => void;
}

export default function JDFormModal({
                                        departmentId,
                                        departments,
                                        existingJD,
                                        onClose,
                                        onSaved,
                                    }: JDFormModalProps) {
    const [selectedDeptId, setSelectedDeptId] = useState<number | "">(
        existingJD?.department_id || departmentId || ""
    );
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [requirements, setRequirements] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEditing = !!existingJD;
    const showDeptSelector = !isEditing && departments && departments.length > 0 && !departmentId;

    useEffect(() => {
        if (existingJD) {
            setTitle(existingJD.title);
            setDescription(existingJD.description);
            setRequirements(existingJD.requirements);
            setSelectedDeptId(existingJD.department_id);
        }
    }, [existingJD]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim()) {
            setError("Title is required.");
            return;
        }
        if (!selectedDeptId) {
            setError("Please select a department.");
            return;
        }

        setSaving(true);
        setError(null);

        try {
            let jd: JD;
            if (isEditing && existingJD) {
                jd = await updateJD(existingJD.id, {title, description, requirements});
            } else {
                jd = await createJD(selectedDeptId as number, {title, description, requirements});
            }
            onSaved(jd);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {isEditing ? "Edit Job Description" : "New Job Description"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-500"
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
                                d="M6 18 18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    {/* Department selector */}
                    {showDeptSelector && (
                        <div>
                            <label
                                htmlFor="jd-department"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Department <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="jd-department"
                                value={selectedDeptId}
                                onChange={(e) =>
                                    setSelectedDeptId(e.target.value ? Number(e.target.value) : "")
                                }
                                className="input-field mt-1"
                            >
                                <option value="">-- Select department --</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label
                            htmlFor="jd-title"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="jd-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Senior Frontend Engineer"
                            className="input-field mt-1"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="jd-description"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Description
                        </label>
                        <textarea
                            id="jd-description"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the role and responsibilities..."
                            className="textarea-field mt-1"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="jd-requirements"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Requirements
                        </label>
                        <textarea
                            id="jd-requirements"
                            rows={4}
                            value={requirements}
                            onChange={(e) => setRequirements(e.target.value)}
                            placeholder="List the required skills, experience, qualifications..."
                            className="textarea-field mt-1"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="btn-primary">
                            {saving ? (
                                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm"/>
                  Saving...
                </span>
                            ) : isEditing ? (
                                "Update"
                            ) : (
                                "Create"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

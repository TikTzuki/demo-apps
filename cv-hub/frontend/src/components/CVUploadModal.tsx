"use client";

import {useState, useRef, type DragEvent} from "react";
import {uploadCV, type CV} from "@/lib/api";
import LoadingSpinner from "./LoadingSpinner";

interface CVUploadModalProps {
    departmentId: number;
    onClose: () => void;
    onUploaded: (cv: CV) => void;
}

export default function CVUploadModal({
                                          departmentId,
                                          onClose,
                                          onUploaded,
                                      }: CVUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    function handleFileSelect(selectedFile: File | undefined) {
        if (!selectedFile) return;
        if (selectedFile.type !== "application/pdf") {
            setError("Only PDF files are accepted.");
            return;
        }
        setError(null);
        setFile(selectedFile);
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        setDragOver(false);
        const droppedFile = e.dataTransfer.files[0];
        handleFileSelect(droppedFile);
    }

    async function handleUpload() {
        if (!file) return;
        setUploading(true);
        setError(null);
        try {
            const cv = await uploadCV(departmentId, file);
            onUploaded(cv);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploading(false);
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
            <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Upload CV</h2>
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

                {/* Drop zone */}
                <div
                    className={`mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
                        dragOver
                            ? "border-indigo-400 bg-indigo-50"
                            : file
                                ? "border-green-300 bg-green-50"
                                : "border-gray-300 bg-gray-50 hover:border-gray-400"
                    }`}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files?.[0])}
                    />

                    {file ? (
                        <>
                            <svg
                                className="h-10 w-10 text-green-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                />
                            </svg>
                            <p className="mt-2 text-sm font-medium text-gray-900">
                                {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </>
                    ) : (
                        <>
                            <svg
                                className="h-10 w-10 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                                />
                            </svg>
                            <p className="mt-2 text-sm font-medium text-gray-700">
                                Drop a PDF here, or{" "}
                                <span className="text-indigo-600">browse</span>
                            </p>
                            <p className="mt-1 text-xs text-gray-500">PDF files only</p>
                        </>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="mt-5 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={uploading}
                        className="btn-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="btn-primary"
                    >
                        {uploading ? (
                            <span className="flex items-center gap-2">
                <LoadingSpinner size="sm"/>
                Uploading...
              </span>
                        ) : (
                            "Upload"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

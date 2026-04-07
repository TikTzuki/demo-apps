"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {setAdminKey} from "@/lib/api";

export default function LoginPage() {
    const router = useRouter();
    const [key, setKey] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch(`/api/departments`, {
                headers: {"X-Admin-Key": key},
            });

            if (res.status === 401) {
                setError("Invalid admin key.");
                return;
            }

            if (!res.ok) {
                setError("Server error. Please try again.");
                return;
            }

            setAdminKey(key);
            router.push("/");
        } catch {
            setError("Cannot connect to server.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-sm">
                <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                    <h1 className="text-center text-xl font-bold text-gray-900">
                        CV Hub
                    </h1>
                    <p className="mt-1 text-center text-sm text-gray-500">
                        Enter admin key to continue
                    </p>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        <input
                            type="password"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder="Admin key"
                            className="input-field w-full"
                            autoFocus
                            required
                        />

                        {error && (
                            <p className="text-sm text-red-600">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !key}
                            className="btn-primary w-full justify-center disabled:opacity-50"
                        >
                            {loading ? "Verifying..." : "Sign in"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

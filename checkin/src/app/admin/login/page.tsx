"use client";

import {Suspense, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {Button} from "@/components/ui/button";
import {apiFetch} from "@/lib/api-client";
import type {AdminUserInfo} from "@/lib/types";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const result = await apiFetch<AdminUserInfo>("/api/admin/login", {
            method: "POST",
            json: {email, password},
        });

        if (!result.success) {
            setError(result.error ?? "Không thể đăng nhập");
            setIsSubmitting(false);
            return;
        }

        router.push(searchParams.get("next") || "/admin");
        router.refresh();
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl"
            >
                <div className="text-center mb-6">
                    <div className="text-4xl mb-2">🔐</div>
                    <h1 className="text-xl font-bold text-gray-800">Đăng nhập quản trị</h1>
                    <p className="text-gray-500 text-sm">Hệ thống chấm công Newera.Inc</p>
                </div>

                {error && (
                    <div className="bg-danger/10 text-danger rounded-xl p-3 mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <label className="block mb-3">
                    <span className="text-sm text-gray-600">Email</span>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="username"
                        className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-primary focus:outline-none"
                    />
                </label>

                <label className="block mb-6">
                    <span className="text-sm text-gray-600">Mật khẩu</span>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-primary focus:outline-none"
                    />
                </label>

                <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>
            </form>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Đang tải...</div>}>
            <LoginForm/>
        </Suspense>
    );
}

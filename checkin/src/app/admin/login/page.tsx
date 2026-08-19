"use client";

import {Suspense, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {apiFetch} from "@/lib/api-client";
import {inputClass} from "@/components/admin/Ui";
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
        <div className="min-h-screen flex flex-col lg:flex-row">
            <div className="w-full lg:w-[560px] shrink-0 bg-ink-raised px-8 sm:px-14 py-14 flex flex-col justify-center gap-8">
                <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold uppercase tracking-[0.09em] text-checkout">Newera.Inc</span>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Quản trị chấm công</h1>
                    <p className="text-base text-zinc-500 leading-relaxed">
                        Chỉ dành cho quản trị viên. Nhân viên check-in tại máy đặt ở cửa, không cần đăng nhập.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {error && (
                        <div className="rounded-lg border border-danger/50 bg-danger/10 px-4 py-3 text-sm text-zinc-100">
                            {error}
                        </div>
                    )}

                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-zinc-400">Email</span>
                        <input
                            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                            required autoComplete="username"
                            className={`${inputClass} !bg-ink !border-ink-edge !text-zinc-50 h-12 focus:!border-checkout`}
                        />
                    </label>

                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-zinc-400">Mật khẩu</span>
                        <input
                            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                            required autoComplete="current-password"
                            className={`${inputClass} !bg-ink !border-ink-edge !text-zinc-50 h-12 focus:!border-checkout`}
                        />
                    </label>

                    <button
                        type="submit" disabled={isSubmitting}
                        className="h-12 rounded-lg bg-checkout text-base font-bold text-ink disabled:opacity-60 transition-opacity"
                    >
                        {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
                    </button>
                </form>
            </div>

            <div className="flex-1 px-8 sm:px-14 py-14 flex flex-col justify-center gap-8">
                <ul className="flex flex-col gap-3">
                    {[
                        "Ca chuẩn 08:00–18:00 · OT tính từ 18:00 · ca đêm từ 21:00",
                        "Ngày công cắt lúc 05:00 — ca đêm thuộc về ngày bắt đầu",
                        "Xuất Excel hai sheet: chi tiết từng phiên và tổng công theo người",
                    ].map((fact) => (
                        <li key={fact} className="flex items-center gap-3 text-zinc-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-ink-edge shrink-0"/>
                            <span className="text-sm sm:text-base">{fact}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen"/>}>
            <LoginForm/>
        </Suspense>
    );
}

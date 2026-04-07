"use client";

import {usePathname} from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AuthGuard from "@/components/AuthGuard";

export default function AppShell({children}: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/login";

    return (
        <AuthGuard>
            {isLoginPage ? (
                children
            ) : (
                <div className="flex min-h-screen">
                    <Sidebar/>
                    <main className="flex-1 pl-64">
                        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
                    </main>
                </div>
            )}
        </AuthGuard>
    );
}

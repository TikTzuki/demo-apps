"use client";

import {usePathname} from "next/navigation";
import {AdminShell} from "@/components/admin/AdminShell";

export default function AdminLayout({children}: { children: React.ReactNode }) {
    const pathname = usePathname();

    // The login page is the one admin route without a session, so it renders bare.
    if (pathname === "/admin/login") return <>{children}</>;

    return <AdminShell>{children}</AdminShell>;
}

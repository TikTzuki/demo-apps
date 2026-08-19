"use client";

import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import {CalendarClock, LayoutDashboard, LogOut, Settings, Users} from "lucide-react";
import {cn} from "@/lib/utils";
import {apiFetch} from "@/lib/api-client";

const NAV = [
    {href: "/admin", label: "Hôm nay", icon: LayoutDashboard},
    {href: "/admin/attendance", label: "Chấm công", icon: CalendarClock},
    {href: "/admin/members", label: "Nhân sự", icon: Users},
    {href: "/admin/settings", label: "Cấu hình", icon: Settings},
];

/** Dark chrome over a light workspace — the two halves stay one product. */
export function AdminShell({children}: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await apiFetch("/api/admin/logout", {method: "POST"});
        router.push("/admin/login");
        router.refresh();
    };

    return (
        <div className="min-h-screen bg-zinc-100 text-zinc-900">
            <header className="sticky top-0 z-40 h-[58px] bg-ink px-5 sm:px-7 flex items-center gap-7">
                <Link href="/" className="font-bold text-zinc-50 whitespace-nowrap">Chấm công</Link>

                <nav className="flex-1 flex items-center gap-1 overflow-x-auto">
                    {NAV.map(({href, label, icon: Icon}) => {
                        const isActive = href === "/admin" ? pathname === href : pathname.startsWith(href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                                    isActive ? "bg-ink-line text-zinc-50" : "text-zinc-400 hover:text-zinc-200"
                                )}
                            >
                                <Icon size={15}/>
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                    <LogOut size={15}/>
                    <span className="hidden sm:inline">Đăng xuất</span>
                </button>
            </header>

            <main className="max-w-[1440px] mx-auto p-5 sm:p-7">{children}</main>
        </div>
    );
}

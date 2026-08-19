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

export function AdminShell({children}: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await apiFetch("/api/admin/logout", {method: "POST"});
        router.push("/admin/login");
        router.refresh();
    };

    return (
        <div className="min-h-screen bg-slate-100">
            <header className="bg-white shadow-sm sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
                    <Link href="/" className="font-bold text-gray-800 whitespace-nowrap">
                        ⏰ Chấm công
                    </Link>

                    <nav className="flex-1 flex items-center gap-1 overflow-x-auto">
                        {NAV.map(({href, label, icon: Icon}) => {
                            const isActive = href === "/admin" ? pathname === href : pathname.startsWith(href);
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={cn(
                                        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
                                        isActive ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"
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
                        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                    >
                        <LogOut size={15}/>
                        <span className="hidden sm:inline">Đăng xuất</span>
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-4">{children}</main>
        </div>
    );
}

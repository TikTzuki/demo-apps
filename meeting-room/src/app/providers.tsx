"use client";

import {AdminProvider} from "@/lib/admin-context";
import {ThemeProvider} from "@/lib/theme-context";

export function Providers({children}: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <AdminProvider>{children}</AdminProvider>
        </ThemeProvider>
    );
}

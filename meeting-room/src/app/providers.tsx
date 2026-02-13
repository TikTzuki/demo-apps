"use client";

import {AdminProvider} from "@/lib/admin-context";
import {ThemeProvider} from "@/lib/theme-context";
import {I18nProvider} from "@/lib/i18n/context";

export function Providers({children}: { children: React.ReactNode }) {
    return (
        <I18nProvider>
            <ThemeProvider>
                <AdminProvider>{children}</AdminProvider>
            </ThemeProvider>
        </I18nProvider>
    );
}

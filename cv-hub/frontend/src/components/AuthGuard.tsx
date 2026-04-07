"use client";

import {useEffect, useState} from "react";
import {usePathname, useRouter} from "next/navigation";
import {getAdminKey} from "@/lib/api";

export default function AuthGuard({children}: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [checked, setChecked] = useState(false);

    const isLoginPage = pathname === "/login";

    useEffect(() => {
        const key = getAdminKey();
        if (!key && !isLoginPage) {
            router.replace("/login");
        } else {
            setChecked(true);
        }
    }, [pathname, isLoginPage, router]);

    if (!checked && !isLoginPage) return null;

    return <>{children}</>;
}

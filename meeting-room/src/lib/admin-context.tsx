"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from "react";

interface AdminContextType {
    isAdmin: boolean;
    adminSecret: string | null;
    login: (secret: string) => Promise<boolean>;
    logout: () => void;
}

const AdminContext = createContext<AdminContextType>({
    isAdmin: false,
    adminSecret: null,
    login: async () => false,
    logout: () => {
    },
});

export function AdminProvider({children}: { children: ReactNode }) {
    const [adminSecret, setAdminSecret] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("adminSecret");
        if (stored) setAdminSecret(stored);
    }, []);

    const login = useCallback(async (secret: string): Promise<boolean> => {
        const res = await fetch("/api/admin/verify", {
            method: "POST",
            headers: {"X-Admin-Secret": secret},
        });
        if (res.ok) {
            localStorage.setItem("adminSecret", secret);
            setAdminSecret(secret);
            return true;
        }
        localStorage.removeItem("adminSecret");
        setAdminSecret(null);
        return false;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("adminSecret");
        setAdminSecret(null);
    }, []);

    return (
        <AdminContext.Provider
            value={{isAdmin: !!adminSecret, adminSecret, login, logout}}
        >
            {children}
        </AdminContext.Provider>
    );
}

export const useAdmin = () => useContext(AdminContext);

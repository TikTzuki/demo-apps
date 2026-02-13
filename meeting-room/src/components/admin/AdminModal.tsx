"use client";

import {useState} from "react";
import {Modal} from "@/components/ui/modal";
import {Button} from "@/components/ui/button";
import {useAdmin} from "@/lib/admin-context";
import {useTranslation} from "@/lib/i18n/context";
import {Lock, LogOut} from "lucide-react";

interface AdminModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AdminModal({isOpen, onClose}: AdminModalProps) {
    const {isAdmin, login, logout} = useAdmin();
    const {t} = useTranslation();
    const [secret, setSecret] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleLogin() {
        if (!secret.trim()) return;
        setLoading(true);
        setError("");

        const ok = await login(secret.trim());
        setLoading(false);

        if (ok) {
            setSecret("");
            onClose();
        } else {
            setError(t("admin.invalid"));
        }
    }

    function handleLogout() {
        logout();
        onClose();
    }

    if (isAdmin) {
        return (
            <Modal isOpen={isOpen} onClose={onClose}>
                <div className="text-center">
                    <div
                        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                        <Lock className="h-7 w-7 text-green-600 dark:text-green-400"/>
                    </div>
                    <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {t("admin.active")}
                    </h2>
                    <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                        {t("admin.activeMsg")}
                    </p>
                    <Button variant="danger" onClick={handleLogout} className="w-full">
                        <LogOut className="mr-2 h-4 w-4"/>
                        {t("admin.logout")}
                    </Button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="text-center">
                <div
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <Lock className="h-7 w-7 text-gray-600 dark:text-gray-400"/>
                </div>
                <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t("admin.title")}
                </h2>
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                    {t("admin.enterSecret")}
                </p>

                <input
                    type="password"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    placeholder={t("admin.placeholder")}
                    className="mb-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-gray-500 dark:focus:ring-gray-700"
                    autoFocus
                />

                {error && (
                    <p className="mb-3 text-sm text-red-600 dark:text-red-400">
                        {error}
                    </p>
                )}

                <Button
                    variant="primary"
                    onClick={handleLogin}
                    disabled={loading || !secret.trim()}
                    className="w-full"
                >
                    {loading ? t("admin.verifying") : t("admin.unlock")}
                </Button>
            </div>
        </Modal>
    );
}

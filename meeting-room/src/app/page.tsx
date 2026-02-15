"use client";

import {useCallback, useEffect, useState} from "react";
import {apiFetch} from "@/lib/api";
import type {OrgListItem} from "@/lib/types";
import {OrgCard} from "@/components/org/OrgCard";
import {AdminModal} from "@/components/admin/AdminModal";
import {CreateOrgForm} from "@/components/admin/CreateOrgForm";
import {Button} from "@/components/ui/button";
import {ThemeToggle} from "@/components/ui/theme-toggle";
import {LanguageSwitcher} from "@/components/ui/language-switcher";
import {useAdmin} from "@/lib/admin-context";
import {useTranslation} from "@/lib/i18n/context";
import {DiscordGuideModal} from "@/components/discord/DiscordGuideModal";
import {Building2, Lock, Plus} from "lucide-react";

export default function HomePage() {
    const {isAdmin} = useAdmin();
    const {t} = useTranslation();
    const [orgs, setOrgs] = useState<OrgListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [adminOpen, setAdminOpen] = useState(false);
    const [createOrgOpen, setCreateOrgOpen] = useState(false);
    const [discordGuideOpen, setDiscordGuideOpen] = useState(false);

    const fetchOrgs = useCallback(async () => {
        setLoading(true);
        const res = await apiFetch<OrgListItem[]>("/api/orgs");
        if (res.success && res.data) setOrgs(res.data);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchOrgs();
    }, [fetchOrgs]);

    return (
        <div className="mx-auto min-h-screen max-w-md px-4 py-8">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {t("home.title")}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {t("home.subtitle")}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <LanguageSwitcher/>
                    <ThemeToggle/>
                    <button
                        onClick={() => setAdminOpen(true)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    >
                        <Lock className="h-4 w-4"/>
                    </button>
                </div>
            </div>

            {/* Admin: Create org button */}
            {isAdmin && (
                <Button
                    variant="ghost"
                    onClick={() => setCreateOrgOpen(true)}
                    className="mb-4 w-full"
                >
                    <Plus className="mr-2 h-4 w-4"/>
                    {t("home.newOrg")}
                </Button>
            )}

            {/* Org list */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-24 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800"
                        />
                    ))}
                </div>
            ) : orgs.length === 0 ? (
                <div className="mt-20 text-center">
                    <Building2 className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600"/>
                    <p className="mt-4 text-gray-400 dark:text-gray-500">
                        {t("home.empty")}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {orgs.map((org) => (
                        <OrgCard key={org.id} org={org} onDeleted={fetchOrgs}/>
                    ))}
                </div>
            )}

            {/* Add to Discord */}
            <div className="mt-8 flex justify-center">
                <button
                    onClick={() => setDiscordGuideOpen(true)}
                    className="flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path
                            d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                    </svg>
                    {t("discord.addToDiscord")}
                </button>
            </div>

            {/* Modals */}
            <AdminModal isOpen={adminOpen} onClose={() => setAdminOpen(false)}/>
            <CreateOrgForm
                isOpen={createOrgOpen}
                onClose={() => setCreateOrgOpen(false)}
                onCreated={fetchOrgs}
            />
            <DiscordGuideModal
                isOpen={discordGuideOpen}
                onClose={() => setDiscordGuideOpen(false)}
            />
        </div>
    );
}

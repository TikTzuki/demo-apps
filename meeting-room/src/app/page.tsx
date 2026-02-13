"use client";

import {useCallback, useEffect, useState} from "react";
import {apiFetch} from "@/lib/api";
import type {OrgListItem} from "@/lib/types";
import {OrgCard} from "@/components/org/OrgCard";
import {AdminModal} from "@/components/admin/AdminModal";
import {CreateOrgForm} from "@/components/admin/CreateOrgForm";
import {Button} from "@/components/ui/button";
import {ThemeToggle} from "@/components/ui/theme-toggle";
import {useAdmin} from "@/lib/admin-context";
import {Building2, Lock, Plus} from "lucide-react";

export default function HomePage() {
    const {isAdmin} = useAdmin();
    const [orgs, setOrgs] = useState<OrgListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [adminOpen, setAdminOpen] = useState(false);
    const [createOrgOpen, setCreateOrgOpen] = useState(false);

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
                        Meeting Rooms
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Select an organization to book a room
                    </p>
                </div>
                <div className="flex items-center gap-2">
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
                    New Organization
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
                        No organizations yet
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {orgs.map((org) => (
                        <OrgCard key={org.id} org={org} onDeleted={fetchOrgs}/>
                    ))}
                </div>
            )}

            {/* Modals */}
            <AdminModal isOpen={adminOpen} onClose={() => setAdminOpen(false)}/>
            <CreateOrgForm
                isOpen={createOrgOpen}
                onClose={() => setCreateOrgOpen(false)}
                onCreated={fetchOrgs}
            />
        </div>
    );
}

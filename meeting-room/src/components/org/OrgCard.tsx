"use client";

import type {OrgListItem} from "@/lib/types";
import {Building2, ChevronRight, DoorOpen, Trash2} from "lucide-react";
import {useRouter} from "next/navigation";
import {useAdmin} from "@/lib/admin-context";
import {useTranslation} from "@/lib/i18n/context";
import {apiFetch} from "@/lib/api";

interface OrgCardProps {
    org: OrgListItem;
    onDeleted: () => void;
}

export function OrgCard({org, onDeleted}: OrgCardProps) {
    const router = useRouter();
    const {isAdmin, adminSecret} = useAdmin();
    const {t} = useTranslation();

    async function handleDelete(e: React.MouseEvent) {
        e.stopPropagation();
        if (!confirm(t("org.deleteConfirm", {name: org.name}))) return;

        const res = await apiFetch(`/api/admin/orgs/${org.id}`, {
            method: "DELETE",
            adminSecret: adminSecret ?? undefined,
        });

        if (res.success) onDeleted();
    }

    const roomCountText = org.roomCount === 1
        ? t("org.roomCount", {count: org.roomCount})
        : t("org.roomCountPlural", {count: org.roomCount});

    return (
        <div
            onClick={() => router.push(`/orgs/${org.id}`)}
            className="group cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                        <Building2 className="h-5 w-5 text-gray-600 dark:text-gray-400"/>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {org.name}
                        </h3>
                        {org.description && (
                            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                                {org.description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isAdmin && (
                        <button
                            onClick={handleDelete}
                            className="rounded-lg p-2 text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:text-gray-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                        >
                            <Trash2 className="h-4 w-4"/>
                        </button>
                    )}
                    <ChevronRight
                        className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-600 dark:text-gray-600 dark:group-hover:text-gray-400"/>
                </div>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <DoorOpen className="h-3.5 w-3.5"/>
                <span>{roomCountText}</span>
            </div>
        </div>
    );
}

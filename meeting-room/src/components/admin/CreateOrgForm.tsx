"use client";

import {useState} from "react";
import {Modal} from "@/components/ui/modal";
import {Button} from "@/components/ui/button";
import {useAdmin} from "@/lib/admin-context";
import {useTranslation} from "@/lib/i18n/context";
import {apiFetch} from "@/lib/api";
import {Building2} from "lucide-react";

interface CreateOrgFormProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

export function CreateOrgForm({
                                  isOpen,
                                  onClose,
                                  onCreated,
                              }: CreateOrgFormProps) {
    const {adminSecret} = useAdmin();
  const {t} = useTranslation();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit() {
        if (!name.trim()) return;
        setLoading(true);
        setError("");

        const res = await apiFetch("/api/admin/orgs", {
            method: "POST",
            body: JSON.stringify({
                name: name.trim(),
                description: description.trim() || undefined,
            }),
            adminSecret: adminSecret ?? undefined,
        });

        setLoading(false);

        if (res.success) {
            setName("");
            setDescription("");
            onCreated();
            onClose();
        } else {
          setError(res.error ?? t("admin.createFailed"));
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div>
                <div
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <Building2 className="h-7 w-7 text-gray-600 dark:text-gray-400"/>
                </div>
                <h2 className="mb-4 text-center text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t("admin.newOrg")}
                </h2>

                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("admin.orgName")}
                    className="mb-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-gray-500 dark:focus:ring-gray-700"
                    autoFocus
                />

                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("admin.orgDesc")}
                    rows={2}
                    className="mb-3 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-gray-500 dark:focus:ring-gray-700"
                />

                {error && (
                    <p className="mb-3 text-sm text-red-600 dark:text-red-400">
                        {error}
                    </p>
                )}

                <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={loading || !name.trim()}
                    className="w-full"
                >
                  {loading ? t("admin.creating") : t("admin.createOrg")}
                </Button>
            </div>
        </Modal>
    );
}

"use client";

import {useState} from "react";
import {Modal} from "@/components/ui/modal";
import {Button} from "@/components/ui/button";
import {useAdmin} from "@/lib/admin-context";
import {useTranslation} from "@/lib/i18n/context";
import {apiFetch} from "@/lib/api";
import {DoorOpen} from "lucide-react";

interface CreateRoomFormProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
    orgId: string;
}

export function CreateRoomForm({
                                   isOpen,
                                   onClose,
                                   onCreated,
                                   orgId,
                               }: CreateRoomFormProps) {
    const {adminSecret} = useAdmin();
    const {t} = useTranslation();
    const [name, setName] = useState("");
    const [capacity, setCapacity] = useState("6");
    const [location, setLocation] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit() {
        if (!name.trim()) return;
        setLoading(true);
        setError("");

        const res = await apiFetch(`/api/admin/orgs/${orgId}/rooms`, {
            method: "POST",
            body: JSON.stringify({
                name: name.trim(),
                capacity: parseInt(capacity, 10) || 1,
                location: location.trim() || undefined,
            }),
            adminSecret: adminSecret ?? undefined,
        });

        setLoading(false);

        if (res.success) {
            setName("");
            setCapacity("6");
            setLocation("");
            onCreated();
            onClose();
        } else {
            setError(res.error ?? t("admin.createRoomFailed"));
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div>
                <div
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <DoorOpen className="h-7 w-7 text-gray-600 dark:text-gray-400"/>
                </div>
                <h2 className="mb-4 text-center text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t("admin.newRoom")}
                </h2>

                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("admin.roomName")}
                    className="mb-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-gray-500 dark:focus:ring-gray-700"
                    autoFocus
                />

                <div className="mb-3 flex gap-3">
                    <input
                        type="number"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        placeholder={t("admin.capacity")}
                        min={1}
                        max={1000}
                        className="w-1/2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-gray-500 dark:focus:ring-gray-700"
                    />
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder={t("admin.location")}
                        className="w-1/2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-gray-500 dark:focus:ring-gray-700"
                    />
                </div>

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
                    {loading ? t("admin.creatingRoom") : t("admin.createRoom")}
                </Button>
            </div>
        </Modal>
    );
}

"use client";

import {useCallback, useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api";
import type {RoomListItem} from "@/lib/types";
import {RoomCard} from "@/components/room/RoomCard";
import {CreateRoomForm} from "@/components/admin/CreateRoomForm";
import {Button} from "@/components/ui/button";
import {useAdmin} from "@/lib/admin-context";
import {useTranslation} from "@/lib/i18n/context";
import {ArrowLeft, DoorOpen, Plus} from "lucide-react";

export default function OrgDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const {isAdmin} = useAdmin();
  const {t} = useTranslation();
    const [rooms, setRooms] = useState<RoomListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [createRoomOpen, setCreateRoomOpen] = useState(false);

    const fetchRooms = useCallback(async () => {
        setLoading(true);
        const res = await apiFetch<RoomListItem[]>(`/api/orgs/${params.id}/rooms`);
        if (res.success && res.data) setRooms(res.data);
        setLoading(false);
    }, [params.id]);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    // Auto-refresh room status every 30 seconds
    useEffect(() => {
        const interval = setInterval(fetchRooms, 30000);
        return () => clearInterval(interval);
    }, [fetchRooms]);

    return (
        <div className="mx-auto min-h-screen max-w-md px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => router.push("/")}
                    className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                    <ArrowLeft className="h-4 w-4"/>
                  {t("org.back")}
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {t("org.rooms")}
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t("org.subtitle")}
                </p>
            </div>

            {/* Admin: Create room button */}
            {isAdmin && (
                <Button
                    variant="ghost"
                    onClick={() => setCreateRoomOpen(true)}
                    className="mb-4 w-full"
                >
                    <Plus className="mr-2 h-4 w-4"/>
                  {t("org.newRoom")}
                </Button>
            )}

            {/* Room list */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-28 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800"
                        />
                    ))}
                </div>
            ) : rooms.length === 0 ? (
                <div className="mt-20 text-center">
                    <DoorOpen className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600"/>
                  <p className="mt-4 text-gray-400 dark:text-gray-500">{t("org.empty")}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {rooms.map((room) => (
                        <RoomCard key={room.id} room={room} onDeleted={fetchRooms}/>
                    ))}
                </div>
            )}

            {/* Modals */}
            <CreateRoomForm
                isOpen={createRoomOpen}
                onClose={() => setCreateRoomOpen(false)}
                onCreated={fetchRooms}
                orgId={params.id}
            />
        </div>
    );
}

"use client";

import type {RoomListItem} from "@/lib/types";
import {cn, formatDuration, getRemainingMinutes} from "@/lib/utils";
import {ChevronRight, MapPin, Trash2, Users} from "lucide-react";
import {useRouter} from "next/navigation";
import {useAdmin} from "@/lib/admin-context";
import {apiFetch} from "@/lib/api";

interface RoomCardProps {
    room: RoomListItem;
    onDeleted: () => void;
}

export function RoomCard({room, onDeleted}: RoomCardProps) {
    const router = useRouter();
    const {isAdmin, adminSecret} = useAdmin();
    const remaining = room.currentBooking
        ? getRemainingMinutes(room.currentBooking.endTime)
        : 0;

    async function handleDelete(e: React.MouseEvent) {
        e.stopPropagation();
        if (!confirm(`Delete "${room.name}" and all its bookings?`)) return;

        const res = await apiFetch(`/api/admin/rooms/${room.id}`, {
            method: "DELETE",
            adminSecret: adminSecret ?? undefined,
        });

        if (res.success) onDeleted();
    }

    return (
        <div
            onClick={() => router.push(`/rooms/${room.id}`)}
            className="group cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {room.name}
                        </h3>
                        <span
                            className={cn(
                                "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                                room.status === "available"
                                    ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400"
                                    : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
                            )}
                        >
              {room.status === "available" ? "Available" : "Occupied"}
            </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        {room.capacity > 0 && (
                            <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5"/>
                                {room.capacity}
              </span>
                        )}
                        {room.location && (
                            <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5"/>
                                {room.location}
              </span>
                        )}
                    </div>

                    {room.currentBooking && (
                        <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
                            Booked by {room.currentBooking.bookerName} &middot;{" "}
                            {formatDuration(remaining)} left
                        </p>
                    )}
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
        </div>
    );
}

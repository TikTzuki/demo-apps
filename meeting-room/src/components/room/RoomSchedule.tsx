"use client";

import type {BookingSlot} from "@/lib/types";
import {formatTime, formatDuration, cn} from "@/lib/utils";

interface RoomScheduleProps {
    bookings: BookingSlot[];
}

export function RoomSchedule({bookings}: RoomScheduleProps) {
    const now = new Date();

    if (bookings.length === 0) {
        return (
            <div className="rounded-2xl bg-gray-100 p-6 text-center dark:bg-gray-800">
                <p className="text-sm text-gray-400 dark:text-gray-500">
                    No bookings today
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {bookings.map((slot) => {
                const start = new Date(slot.startTime);
                const end = new Date(slot.endTime);
                const isActive = start <= now && end > now;
                const isPast = end <= now;

                return (
                    <div
                        key={slot.id}
                        className={cn(
                            "rounded-xl px-4 py-3 transition-all",
                            isActive
                                ? "bg-gray-900 text-white ring-1 ring-gray-700 dark:bg-white dark:text-gray-900 dark:ring-gray-300"
                                : isPast
                                    ? "bg-gray-100 opacity-50 dark:bg-gray-800"
                                    : "bg-gray-100 dark:bg-gray-800"
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                <span
                    className={cn(
                        "font-medium",
                        isActive
                            ? "text-white dark:text-gray-900"
                            : "text-gray-900 dark:text-gray-100"
                    )}
                >
                  {slot.bookerName}
                </span>
                                {isActive && (
                                    <span
                                        className={cn(
                                            "ml-2 inline-flex items-center gap-1 text-xs",
                                            "text-gray-300 dark:text-gray-500"
                                        )}
                                    >
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500"/>
                    Now
                  </span>
                                )}
                            </div>
                            <span
                                className={cn(
                                    "text-sm",
                                    isActive
                                        ? "text-gray-300 dark:text-gray-500"
                                        : "text-gray-500 dark:text-gray-400"
                                )}
                            >
                {formatDuration(slot.durationMinutes)}
              </span>
                        </div>
                        <p
                            className={cn(
                                "mt-1 text-sm",
                                isActive
                                    ? "text-gray-400 dark:text-gray-500"
                                    : "text-gray-400 dark:text-gray-500"
                            )}
                        >
                            {formatTime(slot.startTime)} &ndash; {formatTime(slot.endTime)}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}

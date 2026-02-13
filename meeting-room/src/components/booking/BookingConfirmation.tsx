"use client";

import {Modal} from "@/components/ui/modal";
import {Button} from "@/components/ui/button";
import {formatTime, formatDuration} from "@/lib/utils";
import type {BookingConfirmation as BookingConfirmationType} from "@/lib/types";
import {Check} from "lucide-react";

interface BookingConfirmationProps {
    booking: BookingConfirmationType | null;
    onClose: () => void;
}

export function BookingConfirmation({
                                        booking,
                                        onClose,
                                    }: BookingConfirmationProps) {
    if (!booking) return null;

    return (
        <Modal isOpen={!!booking} onClose={onClose}>
            <div className="text-center">
                <div
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <Check className="h-7 w-7 text-green-600 dark:text-green-400"/>
                </div>
                <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Booked!
                </h2>
                <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
                    Your room is reserved.
                </p>

                <div className="mb-5 space-y-2 rounded-xl bg-gray-50 p-4 text-left text-sm dark:bg-gray-800">
                    <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Room</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
              {booking.roomName}
            </span>
                    </div>
                    <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">
              Organization
            </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
              {booking.orgName}
            </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Name</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
              {booking.bookerName}
            </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Time</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
              {formatTime(booking.startTime)} &ndash;{" "}
                            {formatTime(booking.endTime)}
            </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Duration</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
              {formatDuration(booking.durationMinutes)}
            </span>
                    </div>
                </div>

                <Button variant="primary" onClick={onClose} className="w-full">
                    Done
                </Button>
            </div>
        </Modal>
    );
}

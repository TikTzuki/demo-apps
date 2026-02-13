"use client";

import {useState} from "react";
import {Modal} from "@/components/ui/modal";
import {Button} from "@/components/ui/button";
import {formatDuration, formatTime} from "@/lib/utils";
import type {BookingSlot} from "@/lib/types";
import {useTranslation} from "@/lib/i18n/context";

interface CancelBookingModalProps {
    booking: BookingSlot | null;
    onConfirm: (bookingId: string, bookerName: string) => void;
    onClose: () => void;
    loading: boolean;
    error: string;
}

export function CancelBookingModal({
                                       booking,
                                       onConfirm,
                                       onClose,
                                       loading,
                                       error,
                                   }: CancelBookingModalProps) {
    const {t} = useTranslation();
    const [nameInput, setNameInput] = useState("");

    if (!booking) return null;

    const nameMatches =
        nameInput.trim().toLowerCase() === booking.bookerName.toLowerCase();

    function handleConfirm() {
        if (!booking || !nameMatches) return;
        onConfirm(booking.id, nameInput.trim());
    }

    return (
        <Modal isOpen={!!booking} onClose={onClose}>
            <div>
                <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t("booking.cancelTitle")}
                </h2>
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                    {t("booking.cancelConfirm")}
                </p>

                <div className="mb-4 space-y-2 rounded-xl bg-gray-50 p-4 text-sm dark:bg-gray-800">
                    <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">{t("booking.nameLabel")}</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                            {booking.bookerName}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">{t("booking.time")}</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                            {formatTime(booking.startTime)} &ndash;{" "}
                            {formatTime(booking.endTime)}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">{t("booking.duration")}</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                            {formatDuration(booking.durationMinutes)}
                        </span>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t("booking.typeToConfirm", {name: booking.bookerName})}
                    </label>
                    <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder={booking.bookerName}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-red-400 focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-600 dark:focus:border-red-500 dark:focus:ring-red-900"
                        autoFocus
                    />
                </div>

                {error && (
                    <p className="mb-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        {error}
                    </p>
                )}

                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1"
                        disabled={loading}
                    >
                        {t("booking.keep")}
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleConfirm}
                        className="flex-1"
                        disabled={!nameMatches || loading}
                    >
                        {loading ? t("booking.cancelling") : t("booking.cancelBooking")}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

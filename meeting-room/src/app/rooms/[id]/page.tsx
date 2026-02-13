"use client";

import {useCallback, useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api";
import {getDateString} from "@/lib/utils";
import type {BookingConfirmation as BookingConfirmationType, BookingSlot,} from "@/lib/types";
import {BookingForm} from "@/components/booking/BookingForm";
import {BookingConfirmation} from "@/components/booking/BookingConfirmation";
import {CancelBookingModal} from "@/components/booking/CancelBookingModal";
import {ArrowLeft} from "lucide-react";

export default function RoomBookingPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const [selectedDate, setSelectedDate] = useState(() => getDateString());
    const [bookings, setBookings] = useState<BookingSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [confirmation, setConfirmation] =
        useState<BookingConfirmationType | null>(null);
  const [cancelTarget, setCancelTarget] = useState<BookingSlot | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

    const fetchBookings = useCallback(async () => {
        setLoading(true);
        const res = await apiFetch<BookingSlot[]>(
            `/api/rooms/${params.id}/bookings?date=${selectedDate}`
        );
        if (res.success && res.data) setBookings(res.data);
        setLoading(false);
    }, [params.id, selectedDate]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    async function handleBook(data: {
        bookerName: string;
        startTime: string;
        durationMinutes: number;
    }) {
        setSubmitting(true);
        setError("");

        const res = await apiFetch<BookingConfirmationType>("/api/bookings", {
            method: "POST",
            body: JSON.stringify({...data, roomId: params.id}),
        });

        setSubmitting(false);

        if (res.success && res.data) {
            setConfirmation(res.data);
            fetchBookings();
        } else {
            setError(res.error ?? "Failed to create booking");
        }
    }

  function handleBookingTap(booking: BookingSlot) {
    setCancelTarget(booking);
    setCancelError("");
  }

  async function handleCancelConfirm(bookingId: string, bookerName: string) {
    setCancelling(true);
    setCancelError("");

    const res = await apiFetch(`/api/bookings/${bookingId}`, {
      method: "DELETE",
      body: JSON.stringify({bookerName}),
    });

    setCancelling(false);

    if (res.success) {
      setCancelTarget(null);
      fetchBookings();
    } else {
      setCancelError(res.error ?? "Failed to cancel booking");
    }
  }

    return (
        <div className="mx-auto min-h-screen max-w-lg px-4 py-8">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => router.back()}
                    className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                    <ArrowLeft className="h-4 w-4"/>
                    Back
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Book Room
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Pick a date, select a time range, and book
                </p>
            </div>

            {/* Booking form with integrated date picker + time grid */}
            <div className="mb-6">
                {loading ? (
                    <div className="space-y-4">
                        <div className="h-12 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800"/>
                        <div className="h-16 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800"/>
                        <div className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800"/>
                    </div>
                ) : (
                    <BookingForm
                        onSubmit={handleBook}
                        loading={submitting}
                        bookings={bookings}
                        selectedDate={selectedDate}
                        onDateChange={setSelectedDate}
                        onBookingTap={handleBookingTap}
                    />
                )}
                {error && (
                    <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        {error}
                    </p>
                )}
            </div>

            {/* Confirmation modal */}
            <BookingConfirmation
                booking={confirmation}
                onClose={() => setConfirmation(null)}
            />

          {/* Cancel booking modal */}
          <CancelBookingModal
              booking={cancelTarget}
              onConfirm={handleCancelConfirm}
              onClose={() => setCancelTarget(null)}
              loading={cancelling}
              error={cancelError}
          />
        </div>
    );
}

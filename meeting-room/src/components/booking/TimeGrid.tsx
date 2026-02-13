"use client";

import {useCallback, useEffect, useRef} from "react";
import type {BookingSlot} from "@/lib/types";
import {cn} from "@/lib/utils";

const GRID_START_HOUR = 7;
const GRID_END_HOUR = 22;
const TOTAL_SLOTS = (GRID_END_HOUR - GRID_START_HOUR) * 2; // 30 slots

// Each slot = 1/10 of container width → ~5 hours (10 slots) visible
const SLOT_FRACTION = 1 / 10;

interface TimeGridProps {
    bookings: BookingSlot[];
    selectedStart: number | null;
    selectedEnd: number | null;
    onRangeChange: (start: number, end: number) => void;
    onBookingTap?: (booking: BookingSlot) => void;
    isToday: boolean;
}

function slotToTimeLabel(slotIndex: number): string {
    const totalMinutes = GRID_START_HOUR * 60 + slotIndex * 30;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return m === 0 ? `${h12}${period}` : `${h12}:${String(m).padStart(2, "0")}${period}`;
}

export function slotToHourMinute(slotIndex: number): { hour: number; minute: number } {
    const totalMinutes = GRID_START_HOUR * 60 + slotIndex * 30;
    return {hour: Math.floor(totalMinutes / 60), minute: totalMinutes % 60};
}

function timeToSlotIndex(isoString: string): number {
    const d = new Date(isoString);
    const totalMinutes = d.getHours() * 60 + d.getMinutes();
    const gridStartMinutes = GRID_START_HOUR * 60;
    return (totalMinutes - gridStartMinutes) / 30;
}

function getNowSlotPosition(): number {
    const now = new Date();
    const totalMinutes = now.getHours() * 60 + now.getMinutes();
    const gridStartMinutes = GRID_START_HOUR * 60;
    return (totalMinutes - gridStartMinutes) / 30;
}

export function TimeGrid({
                             bookings,
                             selectedStart,
                             selectedEnd,
                             onRangeChange,
                             onBookingTap,
                             isToday,
                         }: TimeGridProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const draggingRef = useRef<"start" | "end" | null>(null);

    // The earliest slot a user can book on today.
    // floor(nowPos) = the slot the red line is currently inside — this slot is allowed.
    // Slots before it are past.
    const minSlotToday = isToday ? Math.floor(getNowSlotPosition()) : 0;

    // Keep mutable refs for values needed during drag so callbacks never go stale
    const selectedStartRef = useRef(selectedStart);
    const selectedEndRef = useRef(selectedEnd);
    const onRangeChangeRef = useRef(onRangeChange);
    const minSlotTodayRef = useRef(minSlotToday);
    selectedStartRef.current = selectedStart;
    selectedEndRef.current = selectedEnd;
    onRangeChangeRef.current = onRangeChange;
    minSlotTodayRef.current = minSlotToday;

    // Build booked slot set & booking ranges for overlay
    const bookedSlots = new Set<number>();
    const bookingRanges: Array<{ startSlot: number; endSlot: number; name: string; booking: BookingSlot }> = [];

    for (const b of bookings) {
        const startSlot = Math.max(0, timeToSlotIndex(b.startTime));
        const endSlot = Math.min(TOTAL_SLOTS, timeToSlotIndex(b.endTime));
        bookingRanges.push({
            startSlot: Math.floor(startSlot),
            endSlot: Math.ceil(endSlot),
            name: b.bookerName,
            booking: b,
        });
        for (let i = Math.floor(startSlot); i < Math.ceil(endSlot); i++) {
            if (i >= 0 && i < TOTAL_SLOTS) bookedSlots.add(i);
        }
    }

    // Store bookedSlots in a ref so drag handlers can access it
    const bookedSlotsRef = useRef(bookedSlots);
    bookedSlotsRef.current = bookedSlots;

    // Convert a pointer clientX to a slot index using the scroll container as reference
    const clientXToSlot = useCallback((clientX: number): number => {
        if (!scrollRef.current || !containerRef.current) return 0;
        const scrollRect = scrollRef.current.getBoundingClientRect();
        const scrollLeft = scrollRef.current.scrollLeft;
        const x = clientX - scrollRect.left + scrollLeft;
        const containerWidth = containerRef.current.scrollWidth;
        const slotW = containerWidth / TOTAL_SLOTS;
        return Math.max(0, Math.min(TOTAL_SLOTS - 1, Math.round(x / slotW)));
    }, []);

    // Check if range [start, end) has any booked slot
    const rangeHasBooking = useCallback((start: number, end: number): boolean => {
        const slots = bookedSlotsRef.current;
        for (let i = start; i < end; i++) {
            if (slots.has(i)) return true;
        }
        return false;
    }, []);

    // Document-level move handler — uses refs so it never goes stale
    const handleDocumentPointerMove = useCallback(
        (e: PointerEvent) => {
            const handle = draggingRef.current;
            if (!handle) return;

            const curStart = selectedStartRef.current;
            const curEnd = selectedEndRef.current;
            if (curStart === null || curEnd === null) return;

            const slot = clientXToSlot(e.clientX);
            const slots = bookedSlotsRef.current;

            if (handle === "start") {
                // Clamp: must be >= minSlotToday, < curEnd, and the slot must be free
                const minSlot = minSlotTodayRef.current;
                const newStart = Math.max(minSlot, Math.min(slot, curEnd - 1));
                if (!slots.has(newStart) && !rangeHasBooking(newStart, curEnd)) {
                    onRangeChangeRef.current(newStart, curEnd);
                }
            } else {
                // End handle — end is exclusive, so newEnd = slot + 1
                const newEnd = Math.min(TOTAL_SLOTS, Math.max(slot + 1, curStart + 1));
                const lastSlot = newEnd - 1;
                if (!slots.has(lastSlot) && !rangeHasBooking(curStart, newEnd)) {
                    onRangeChangeRef.current(curStart, newEnd);
                }
            }
        },
        [clientXToSlot, rangeHasBooking]
    );

    const handleDocumentPointerUp = useCallback(() => {
        draggingRef.current = null;
        document.removeEventListener("pointermove", handleDocumentPointerMove);
        document.removeEventListener("pointerup", handleDocumentPointerUp);
    }, [handleDocumentPointerMove]);

    // Pointer down on a handle — attach document listeners for the drag session
    const handlePointerDown = useCallback(
        (handle: "start" | "end") => (e: React.PointerEvent) => {
            e.preventDefault();
            e.stopPropagation();
            draggingRef.current = handle;

            // Disable scroll on the container while dragging
            if (scrollRef.current) {
                scrollRef.current.style.overflowX = "hidden";
            }

            document.addEventListener("pointermove", handleDocumentPointerMove);
            document.addEventListener("pointerup", () => {
                draggingRef.current = null;
                if (scrollRef.current) {
                    scrollRef.current.style.overflowX = "auto";
                }
                document.removeEventListener("pointermove", handleDocumentPointerMove);
            }, {once: true});
        },
        [handleDocumentPointerMove]
    );

    // Tap on an empty slot to set selection there
    const handleSlotTap = useCallback(
        (slotIndex: number) => {
            if (bookedSlotsRef.current.has(slotIndex)) return;
            if (slotIndex < minSlotToday) return;
            onRangeChange(slotIndex, slotIndex + 1);
        },
        [minSlotToday, onRangeChange]
    );

    // Auto-scroll to current time on mount
    useEffect(() => {
        if (!scrollRef.current || !containerRef.current) return;
        if (isToday) {
            const containerWidth = containerRef.current.scrollWidth;
            const slotW = containerWidth / TOTAL_SLOTS;
            const nowPos = getNowSlotPosition();
            const scrollTo = Math.max(0, nowPos * slotW - scrollRef.current.clientWidth / 2);
            scrollRef.current.scrollLeft = scrollTo;
        }
    }, [isToday]);

    const nowPos = isToday ? getNowSlotPosition() : -1;
    // The slot the red line is in (minSlotToday) is allowed; only slots before it are past
    const isPastSlot = (idx: number) => isToday && idx < minSlotToday;
    const totalWidthPercent = `${TOTAL_SLOTS * SLOT_FRACTION * 100}%`;

    return (
        <div
            ref={scrollRef}
            className="relative overflow-x-auto rounded-xl border border-gray-200 bg-white scrollbar-none dark:border-gray-700 dark:bg-gray-900"
            style={{touchAction: "pan-x"}}
        >
            <div ref={containerRef} style={{width: totalWidthPercent}}>
                {/* Hour labels row */}
                <div className="flex border-b border-gray-100 dark:border-gray-800">
                    {Array.from({length: TOTAL_SLOTS}, (_, i) => (
                        <div
                            key={`label-${i}`}
                            className="flex-shrink-0 border-r border-gray-100 py-1.5 text-center dark:border-gray-800"
                            style={{width: `${(1 / TOTAL_SLOTS) * 100}%`}}
                        >
                            {i % 2 === 0 ? (
                                <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                  {slotToTimeLabel(i)}
                </span>
                            ) : null}
                        </div>
                    ))}
                </div>

                {/* Slots row */}
                <div className="relative flex" style={{height: 56}}>
                    {Array.from({length: TOTAL_SLOTS}, (_, i) => {
                        const isBooked = bookedSlots.has(i);
                        const isPast = isPastSlot(i);
                        const isDisabled = isBooked || isPast;

                        const isInSelection =
                            selectedStart !== null &&
                            selectedEnd !== null &&
                            i >= selectedStart &&
                            i < selectedEnd;

                        return (
                            <button
                                key={`slot-${i}`}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => !isDisabled && handleSlotTap(i)}
                                className={cn(
                                    "relative h-full flex-shrink-0 border-r border-gray-100 transition-colors dark:border-gray-800",
                                    isBooked
                                        ? "cursor-not-allowed bg-teal-100 dark:bg-teal-900/40"
                                        : isPast
                                            ? "cursor-not-allowed bg-gray-50 dark:bg-gray-800/50"
                                            : isInSelection
                                                ? "bg-gray-900/10 dark:bg-white/10"
                                                : "cursor-pointer bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800"
                                )}
                                style={{width: `${(1 / TOTAL_SLOTS) * 100}%`}}
                            />
                        );
                    })}

                    {/* Booking overlay labels */}
                    {bookingRanges.map((br, idx) => (
                        <button
                            key={`booking-label-${idx}`}
                            type="button"
                            onClick={() => onBookingTap?.(br.booking)}
                            className={cn(
                                "absolute flex items-center justify-center overflow-hidden",
                                onBookingTap ? "cursor-pointer hover:bg-teal-200/50 dark:hover:bg-teal-800/50" : "pointer-events-none"
                            )}
                            style={{
                                left: `${(br.startSlot / TOTAL_SLOTS) * 100}%`,
                                width: `${((br.endSlot - br.startSlot) / TOTAL_SLOTS) * 100}%`,
                                top: 0,
                                height: 56,
                            }}
                        >
              <span className="truncate px-1 text-xs font-medium text-teal-700 dark:text-teal-300">
                {br.name}
              </span>
                        </button>
                    ))}

                    {/* Selected range highlight + handles */}
                    {selectedStart !== null && selectedEnd !== null && (
                        <>
                            {/* Highlight bar */}
                            <div
                                className="pointer-events-none absolute top-0 h-full rounded-lg bg-gray-900/20 dark:bg-white/20"
                                style={{
                                    left: `${(selectedStart / TOTAL_SLOTS) * 100}%`,
                                    width: `${((selectedEnd - selectedStart) / TOTAL_SLOTS) * 100}%`,
                                }}
                            />

                            {/* Start handle */}
                            <div
                                onPointerDown={handlePointerDown("start")}
                                className="absolute top-0 z-10 flex h-full cursor-ew-resize items-center touch-none"
                                style={{
                                    left: `${(selectedStart / TOTAL_SLOTS) * 100}%`,
                                    transform: "translateX(-50%)",
                                }}
                            >
                                <div
                                    className="flex h-10 w-6 items-center justify-center rounded-md bg-gray-900 shadow-md dark:bg-white">
                                    <div className="flex gap-[2px]">
                                        <div className="h-4 w-[1.5px] rounded-full bg-white/60 dark:bg-gray-900/60"/>
                                        <div className="h-4 w-[1.5px] rounded-full bg-white/60 dark:bg-gray-900/60"/>
                                    </div>
                                </div>
                            </div>

                            {/* End handle */}
                            <div
                                onPointerDown={handlePointerDown("end")}
                                className="absolute top-0 z-10 flex h-full cursor-ew-resize items-center touch-none"
                                style={{
                                    left: `${(selectedEnd / TOTAL_SLOTS) * 100}%`,
                                    transform: "translateX(-50%)",
                                }}
                            >
                                <div
                                    className="flex h-10 w-6 items-center justify-center rounded-md bg-gray-900 shadow-md dark:bg-white">
                                    <div className="flex gap-[2px]">
                                        <div className="h-4 w-[1.5px] rounded-full bg-white/60 dark:bg-gray-900/60"/>
                                        <div className="h-4 w-[1.5px] rounded-full bg-white/60 dark:bg-gray-900/60"/>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Now marker */}
                    {isToday && nowPos >= 0 && nowPos <= TOTAL_SLOTS && (
                        <div
                            className="pointer-events-none absolute top-0 z-20 h-full w-0.5 bg-red-500"
                            style={{left: `${(nowPos / TOTAL_SLOTS) * 100}%`}}
                        >
                            <div className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500"/>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export {GRID_START_HOUR, TOTAL_SLOTS};

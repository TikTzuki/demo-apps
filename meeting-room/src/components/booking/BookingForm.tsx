"use client";

import {useState, useCallback, useRef, useEffect} from "react";
import type {BookingSlot} from "@/lib/types";
import {cn} from "@/lib/utils";
import {DatePicker} from "@/components/booking/DatePicker";
import {TimeGrid, slotToHourMinute} from "@/components/booking/TimeGrid";
import {Button} from "@/components/ui/button";
import {CalendarDays, ChevronDown} from "lucide-react";

interface BookingFormProps {
    onSubmit: (data: {
        bookerName: string;
        startTime: string;
        durationMinutes: number;
    }) => void;
    loading: boolean;
    bookings: BookingSlot[];
    selectedDate: string;
    onDateChange: (date: string) => void;
}

function slotToTimeLabel(slotIndex: number): string {
    const {hour, minute} = slotToHourMinute(slotIndex);
    const period = hour >= 12 ? "PM" : "AM";
    const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return minute === 0
        ? `${h12}:00 ${period}`
        : `${h12}:${String(minute).padStart(2, "0")} ${period}`;
}

function formatSelectedDate(dateStr: string): string {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    if (dateStr === todayStr) return "Today";
    return date.toLocaleDateString("en-US", {weekday: "short", month: "short", day: "numeric"});
}

export function BookingForm({
                                onSubmit,
                                loading,
                                bookings,
                                selectedDate,
                                onDateChange,
                            }: BookingFormProps) {
    const [name, setName] = useState("");
    const [selectedStart, setSelectedStart] = useState<number | null>(null);
    const [selectedEnd, setSelectedEnd] = useState<number | null>(null);
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const datePickerRef = useRef<HTMLDivElement>(null);

    const todayKey = (() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    })();

    const isToday = selectedDate === todayKey;

    // Close date picker on outside click
    useEffect(() => {
        if (!datePickerOpen) return;

        function handleClick(e: MouseEvent) {
            if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
                setDatePickerOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [datePickerOpen]);

    const handleRangeChange = useCallback(
        (start: number, end: number) => {
            setSelectedStart(start);
            setSelectedEnd(end);
        },
        []
    );

    function handleDateChange(date: string) {
        setSelectedStart(null);
        setSelectedEnd(null);
        onDateChange(date);
        setDatePickerOpen(false);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim() || selectedStart === null || selectedEnd === null) return;

        const {hour, minute} = slotToHourMinute(selectedStart);
        const [y, m, d] = selectedDate.split("-").map(Number);
        const startDate = new Date(y, m - 1, d, hour, minute, 0, 0);
        const durationMinutes = (selectedEnd - selectedStart) * 30;

        onSubmit({
            bookerName: name.trim(),
            startTime: startDate.toISOString(),
            durationMinutes,
        });
    }

    const hasSelection = selectedStart !== null && selectedEnd !== null;
    const canSubmit = name.trim().length > 0 && hasSelection && !loading;

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Name */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-400">
                    Your Name
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John"
                    maxLength={100}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-gray-400 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-600 dark:focus:border-gray-500 dark:focus:ring-gray-700"
                    autoFocus
                />
            </div>

            {/* Time grid */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-400">
                    Select Time
                </label>
                <TimeGrid
                    bookings={bookings}
                    selectedStart={selectedStart}
                    selectedEnd={selectedEnd}
                    onRangeChange={handleRangeChange}
                    isToday={isToday}
                />
            </div>

            {/* Bottom bar: date + time summary | Book button */}
            <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800">
                {/* Left: date (clickable popup trigger) + time */}
                <div className="relative flex-1" ref={datePickerRef}>
                    <button
                        type="button"
                        onClick={() => setDatePickerOpen((v) => !v)}
                        className="flex items-center gap-1.5 text-sm font-medium text-gray-900 transition-colors hover:text-gray-600 dark:text-gray-100 dark:hover:text-gray-300"
                    >
                        <CalendarDays className="h-3.5 w-3.5"/>
                        {formatSelectedDate(selectedDate)}
                        <ChevronDown className={cn("h-3 w-3 transition-transform", datePickerOpen && "rotate-180")}/>
                    </button>

                    {hasSelection && (
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                            {slotToTimeLabel(selectedStart!)} &ndash; {slotToTimeLabel(selectedEnd!)}
                            <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">
                ({(selectedEnd! - selectedStart!) * 30}m)
              </span>
                        </p>
                    )}
                    {!hasSelection && (
                        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                            Tap or drag to pick a time
                        </p>
                    )}

                    {/* Date picker popup */}
                    {datePickerOpen && (
                        <div
                            className="absolute bottom-full left-0 z-30 mb-2 rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                            <DatePicker selectedDate={selectedDate} onSelect={handleDateChange}/>
                        </div>
                    )}
                </div>

                {/* Right: Book button */}
                <Button
                    type="submit"
                    variant="default"
                    size="default"
                    disabled={!canSubmit}
                    className="shrink-0"
                >
                    {loading ? "Booking..." : "Book Room"}
                </Button>
            </div>
        </form>
    );
}

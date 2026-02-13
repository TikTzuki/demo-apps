"use client";

import {useState} from "react";
import {cn} from "@/lib/utils";
import {ChevronLeft, ChevronRight} from "lucide-react";

interface DatePickerProps {
    selectedDate: string;
    onSelect: (date: string) => void;
}

function formatDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const DAY_HEADERS = ["M", "T", "W", "T", "F", "S", "S"];

function getCalendarDays(year: number, month: number) {
    // month is 0-indexed
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Monday = 0, Sunday = 6
    const startDow = (firstDay.getDay() + 6) % 7;
    const daysInMonth = lastDay.getDate();

    const prevMonthLast = new Date(year, month, 0).getDate();

    const cells: Array<{
        date: number;
        month: number; // 0-indexed
        year: number;
        key: string;
        isCurrentMonth: boolean;
    }> = [];

    // Previous month trailing days
    for (let i = startDow - 1; i >= 0; i--) {
        const d = prevMonthLast - i;
        const m = month - 1 < 0 ? 11 : month - 1;
        const y = month - 1 < 0 ? year - 1 : year;
        cells.push({
            date: d,
            month: m,
            year: y,
            key: formatDateKey(new Date(y, m, d)),
            isCurrentMonth: false,
        });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push({
            date: d,
            month,
            year,
            key: formatDateKey(new Date(year, month, d)),
            isCurrentMonth: true,
        });
    }

    // Next month leading days (fill to complete last row)
    const remainder = cells.length % 7;
    if (remainder > 0) {
        const fill = 7 - remainder;
        const nm = month + 1 > 11 ? 0 : month + 1;
        const ny = month + 1 > 11 ? year + 1 : year;
        for (let d = 1; d <= fill; d++) {
            cells.push({
                date: d,
                month: nm,
                year: ny,
                key: formatDateKey(new Date(ny, nm, d)),
                isCurrentMonth: false,
            });
        }
    }

    return cells;
}

export function DatePicker({selectedDate, onSelect}: DatePickerProps) {
    const today = new Date();
    const todayKey = formatDateKey(today);

    // Parse selectedDate to initialize the viewed month
    const [selY, selM] = selectedDate.split("-").map(Number);
    const [viewYear, setViewYear] = useState(selY);
    const [viewMonth, setViewMonth] = useState(selM - 1); // 0-indexed

    const cells = getCalendarDays(viewYear, viewMonth);

    function prevMonth() {
        if (viewMonth === 0) {
            setViewYear((y) => y - 1);
            setViewMonth(11);
        } else {
            setViewMonth((m) => m - 1);
        }
    }

    function nextMonth() {
        if (viewMonth === 11) {
            setViewYear((y) => y + 1);
            setViewMonth(0);
        } else {
            setViewMonth((m) => m + 1);
        }
    }

    return (
        <div className="w-[280px]">
            {/* Month navigation */}
            <div className="mb-3 flex items-center justify-between">
                <button
                    type="button"
                    onClick={prevMonth}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                >
                    <ChevronLeft className="h-4 w-4"/>
                </button>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {MONTH_NAMES[viewMonth]}
        </span>
                <button
                    type="button"
                    onClick={nextMonth}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                >
                    <ChevronRight className="h-4 w-4"/>
                </button>
            </div>

            {/* Day-of-week headers */}
            <div className="mb-1 grid grid-cols-7 text-center">
                {DAY_HEADERS.map((d, i) => (
                    <span
                        key={i}
                        className="py-1 text-xs font-medium text-gray-400 dark:text-gray-500"
                    >
            {d}
          </span>
                ))}
            </div>

            {/* Date grid */}
            <div className="grid grid-cols-7">
                {cells.map((cell) => {
                    const isSelected = selectedDate === cell.key;
                    const isToday = todayKey === cell.key;
                    const isPast = cell.key < todayKey;

                    return (
                        <button
                            key={cell.key}
                            type="button"
                            disabled={isPast}
                            onClick={() => onSelect(cell.key)}
                            className={cn(
                                "flex h-9 items-center justify-center rounded-full text-sm transition-all",
                                !cell.isCurrentMonth && "opacity-30",
                                isSelected
                                    ? "bg-gray-900 font-semibold text-white dark:bg-white dark:text-gray-900"
                                    : isToday
                                        ? "font-semibold text-indigo-500 dark:text-indigo-400"
                                        : cell.isCurrentMonth
                                            ? "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                            : "text-gray-400 dark:text-gray-600",
                                isPast && !isSelected && "cursor-not-allowed opacity-30"
                            )}
                        >
                            {cell.date}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

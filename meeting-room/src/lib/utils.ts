import {type ClassValue, clsx} from "clsx";
import {twMerge} from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

export function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h} hour${h > 1 ? "s" : ""}`;
}

export function getRemainingMinutes(endTimeIso: string): number {
    const diff = new Date(endTimeIso).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 60000));
}

export function getDateString(date: Date = new Date()): string {
    return date.toISOString().split("T")[0];
}

export function roundToNext5Minutes(date: Date = new Date()): Date {
    const ms = date.getTime();
    const rounded = Math.ceil(ms / (5 * 60000)) * (5 * 60000);
    return new Date(rounded);
}

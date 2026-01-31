import {type ClassValue, clsx} from "clsx";
import {twMerge} from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function generateId(): string {
    return Math.random().toString(36).substring(2, 9);
}

export function formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

// Team colors for bubbles
export const TEAM_COLORS = [
    "#FF6B6B", // Red
    "#4ECDC4", // Teal
    "#45B7D1", // Blue
    "#96CEB4", // Green
    "#FFEAA7", // Yellow
    "#DDA0DD", // Plum
    "#98D8C8", // Mint
    "#F7DC6F", // Gold
    "#BB8FCE", // Purple
    "#85C1E9", // Sky
    "#F8B500", // Orange
    "#00CED1", // Cyan
    "#FF69B4", // Pink
    "#90EE90", // Light Green
];

export function getTeamColor(index: number): string {
    return TEAM_COLORS[index % TEAM_COLORS.length];
}

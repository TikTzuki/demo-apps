import {type ClassValue, clsx} from "clsx";
import {twMerge} from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Fold Vietnamese text for searching: "Lộc" -> "loc", "Đạt" -> "dat".
 *
 * Without this, typing on a keyboard without tone marks finds nothing — which
 * is how most people search a staff list.
 */
export function normalizeVi(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/gi, "d")
        .toLowerCase()
        .trim();
}

export function generateId(): string {
    return Math.random().toString(36).substring(2, 9);
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

export interface OrgListItem {
    id: string;
    name: string;
    description: string | null;
    roomCount: number;
}

export interface RoomListItem {
    id: string;
    name: string;
    capacity: number;
    location: string | null;
    status: "available" | "occupied";
    currentBooking: {
        bookerName: string;
        endTime: string;
    } | null;
}

export interface BookingSlot {
    id: string;
    bookerName: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
}

export interface BookingConfirmation {
    id: string;
    roomName: string;
    orgName: string;
    bookerName: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
}

export interface CreateBookingRequest {
    roomId: string;
    bookerName: string;
    startTime: string;
    durationMinutes: number;
}

export interface CreateOrgRequest {
    name: string;
    description?: string;
}

export interface CreateRoomRequest {
    name: string;
    capacity: number;
    location?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export const DURATION_OPTIONS = [
    {label: "15m", minutes: 15},
    {label: "30m", minutes: 30},
    {label: "45m", minutes: 45},
    {label: "1h", minutes: 60},
    {label: "1.5h", minutes: 90},
    {label: "2h", minutes: 120},
] as const;

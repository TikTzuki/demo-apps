import type {DayStatus} from "@/lib/attendance/compute";

export type {DayStatus, SessionKind} from "@/lib/attendance/compute";

/** Where a member stands right now on the current business day. */
export type MemberState = "OUT" | "WORKING" | "DONE";

export interface MemberAttendance {
    id: string;
    name: string;
    email?: string;
    employeeCode?: string;
    teamId: string;
    state: MemberState;
    /** Check-in time of the session currently open, if any. */
    openedAt?: string;
    lastCheckOutAt?: string;
    isOvernightSession: boolean;
    workedMinutes: number;
    regularMinutes: number;
    otMinutes: number;
    overnightOtMinutes: number;
    statuses: DayStatus[];
    /** Already went home, and it is late enough to start a night shift. */
    canCheckInOvernight: boolean;
}

export interface TeamAttendance {
    id: string;
    name: string;
    color: string;
    members: MemberAttendance[];
    workingCount: number;
    doneCount: number;
    otCount: number;
}

export interface AttendanceBoard {
    workDate: string;
    serverTime: string;
    policy: {
        timezoneOffsetMinutes: number;
        otStartTime: string;
        overnightStartTime: string;
        lateAfterTime: string;
        shiftStartTime: string;
    };
    teams: TeamAttendance[];
    totals: {
        totalMembers: number;
        working: number;
        done: number;
        absent: number;
        onOt: number;
        onOvernight: number;
    };
}

/** Team and member records for admin CRUD, without any attendance state. */
export interface Team {
    id: string;
    name: string;
    color: string;
    members: Member[];
}

export interface Member {
    id: string;
    name: string;
    email?: string;
    employeeCode?: string;
    isActive: boolean;
    teamId: string;
}

export interface AdminUserInfo {
    id: string;
    email: string;
    name: string;
    role: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

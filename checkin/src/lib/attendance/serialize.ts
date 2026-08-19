import type {RangeRow} from "./queries";
import type {DayStatus, SessionKind} from "./compute";

export interface SerializedSession {
    id: string;
    kind: SessionKind;
    checkInAt: string;
    checkOutAt: string | null;
    isOpen: boolean;
    isStale: boolean;
    isManual: boolean;
    isAutoClosed: boolean;
    needsReview: boolean;
    note: string | null;
    durationMinutes: number;
    regularMinutes: number;
    otMinutes: number;
}

export interface SerializedDayRow {
    workDate: string;
    teamName: string;
    teamColor: string;
    memberId: string;
    memberName: string;
    employeeCode: string | null;
    workedMinutes: number;
    regularMinutes: number;
    otMinutes: number;
    overnightOtMinutes: number;
    statuses: DayStatus[];
    sessions: SerializedSession[];
}

/** Range rows as JSON — Dates become ISO strings, minutes stay numbers. */
export function serializeRangeRow(row: RangeRow): SerializedDayRow {
    return {
        workDate: row.day.workDateKey,
        teamName: row.teamName,
        teamColor: row.teamColor,
        memberId: row.memberId,
        memberName: row.memberName,
        employeeCode: row.employeeCode,
        workedMinutes: row.day.workedMinutes,
        regularMinutes: row.day.regularMinutes,
        otMinutes: row.day.otMinutes,
        overnightOtMinutes: row.day.overnightOtMinutes,
        statuses: row.day.statuses,
        sessions: row.day.sessions.map((s) => ({
            id: s.id,
            kind: s.kind,
            checkInAt: s.checkInAt.toISOString(),
            checkOutAt: s.checkOutAt?.toISOString() ?? null,
            isOpen: s.isOpen,
            isStale: s.isStale,
            isManual: s.isManual ?? false,
            isAutoClosed: s.autoClosedAt != null,
            needsReview: s.autoClosedAt != null && s.reviewedAt == null,
            note: s.note ?? null,
            durationMinutes: s.durationMinutes,
            regularMinutes: s.regularMinutes,
            otMinutes: s.otMinutes,
        })),
    };
}

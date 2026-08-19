/**
 * Overtime rules, as pure functions.
 *
 * OT is clock-based: any time worked after `otStartTime` counts as overtime,
 * regardless of when the person arrived. An 08:00 → 22:00 day therefore yields
 * exactly 4h of OT, which is how the business describes it.
 *
 * Nothing here touches Prisma or reads the clock — `now` is always passed in.
 */

import {
    boundaryAt,
    localMinutesOfDay,
    MINUTE_MS,
    overlapMinutes,
    parseHHmm,
    type TimePolicy,
    workDateKey,
} from "./time";

export type SessionKind = "DAY" | "OVERNIGHT";

export type DayStatus =
    | "ABSENT"
    | "AUTO_CLOSED"
    | "PRESENT"
    | "WORKING"
    | "LATE"
    | "EARLY_LEAVE"
    | "OT"
    | "OT_OVERNIGHT"
    | "MISSING_CHECKOUT";

export interface AttendancePolicy extends TimePolicy {
    shiftStartTime: string;
    lateAfterTime: string;
    otStartTime: string;
    overnightStartTime: string;
    standardShiftMinutes: number;
    breakMinutes: number;
    breakStartTime: string;
    otMinMinutes: number;
    maxSessionHours: number;
}

export const DEFAULT_POLICY: AttendancePolicy = {
    timezoneOffsetMinutes: 420,
    dayCutoffHour: 5,
    shiftStartTime: "08:00",
    lateAfterTime: "10:00",
    otStartTime: "18:00",
    overnightStartTime: "21:00",
    standardShiftMinutes: 480,
    breakMinutes: 90,
    breakStartTime: "12:00",
    otMinMinutes: 30,
    maxSessionHours: 16,
};

export interface SessionInput {
    id: string;
    workDate: Date;
    checkInAt: Date;
    checkOutAt: Date | null;
    kind: SessionKind;
    note?: string | null;
    isManual?: boolean;
    /** Set when the system closed a forgotten session instead of a person. */
    autoClosedAt?: Date | null;
    /** Set once an admin has checked that auto-closed session. */
    reviewedAt?: Date | null;
}

export interface SessionSummary extends SessionInput {
    isOpen: boolean;
    /** Open for longer than `maxSessionHours` — someone forgot to check out. */
    isStale: boolean;
    /** Wall-clock minutes between check-in and check-out. */
    durationMinutes: number;
    /** Minutes removed for the lunch break. */
    breakDeducted: number;
    /** Minutes worked before the OT boundary, net of the break. */
    regularMinutes: number;
    /** Minutes worked after the OT boundary. */
    otMinutes: number;
}

export interface DaySummary {
    workDate: Date;
    workDateKey: string;
    sessions: SessionSummary[];
    /** Everything actually worked, net of breaks and uncapped. */
    workedMinutes: number;
    /** Normal hours, capped at the standard shift. */
    regularMinutes: number;
    /** Overtime, after the minimum-OT threshold is applied. */
    otMinutes: number;
    /** The slice of `otMinutes` earned on an overnight session. */
    overnightOtMinutes: number;
    firstCheckInAt: Date | null;
    lastCheckOutAt: Date | null;
    isWorking: boolean;
    statuses: DayStatus[];
}

/** Classify a session by when it started — a late-evening arrival is a night shift. */
export function classifyKind(checkInAt: Date, policy: AttendancePolicy): SessionKind {
    const checkInMinutes = localMinutesOfDay(checkInAt, policy);
    // Small-hours arrivals (past midnight, before the cutoff) are the tail of a
    // night shift, not the start of one.
    if (checkInMinutes < policy.dayCutoffHour * 60) return "OVERNIGHT";
    return checkInMinutes >= parseHHmm(policy.overnightStartTime) ? "OVERNIGHT" : "DAY";
}

function computeSession(
    session: SessionInput,
    policy: AttendancePolicy,
    now: Date
): SessionSummary {
    const isOpen = session.checkOutAt === null;
    const openMs = now.getTime() - session.checkInAt.getTime();
    const isStale = isOpen && openMs > policy.maxSessionHours * 60 * MINUTE_MS;

    if (session.checkOutAt === null) {
        // An open session contributes no minutes: we do not know when it ended,
        // and inventing a check-out time would corrupt payroll.
        return {
            ...session,
            isOpen: true,
            isStale,
            durationMinutes: 0,
            breakDeducted: 0,
            regularMinutes: 0,
            otMinutes: 0,
        };
    }

    const checkOutAt = session.checkOutAt;
    const otBoundary = boundaryAt(session.workDate, policy.otStartTime, policy);
    const breakStart = boundaryAt(session.workDate, policy.breakStartTime, policy);
    const breakEnd = new Date(breakStart.getTime() + policy.breakMinutes * MINUTE_MS);

    const durationMinutes = overlapMinutes(session.checkInAt, checkOutAt, null, null);
    const regularRaw = overlapMinutes(session.checkInAt, checkOutAt, null, otBoundary);
    const breakDeducted = Math.min(
        overlapMinutes(session.checkInAt, checkOutAt, breakStart, breakEnd),
        policy.breakMinutes,
        regularRaw
    );

    return {
        ...session,
        isOpen: false,
        isStale: false,
        durationMinutes,
        breakDeducted,
        regularMinutes: Math.max(0, regularRaw - breakDeducted),
        otMinutes: overlapMinutes(session.checkInAt, checkOutAt, otBoundary, null),
    };
}

/** Roll a member's sessions for one business day into the numbers payroll needs. */
export function computeDay(
    workDate: Date,
    sessions: readonly SessionInput[],
    policy: AttendancePolicy,
    now: Date
): DaySummary {
    const ordered = [...sessions].sort((a, b) => a.checkInAt.getTime() - b.checkInAt.getTime());
    const summaries = ordered.map((session) => computeSession(session, policy, now));

    const regularRaw = summaries.reduce((sum, s) => sum + s.regularMinutes, 0);
    const otRaw = summaries.reduce((sum, s) => sum + s.otMinutes, 0);
    const overnightRaw = summaries
        .filter((s) => s.kind === "OVERNIGHT")
        .reduce((sum, s) => sum + s.otMinutes, 0);

    // Short overruns are not overtime — otherwise every 18:05 departure files a claim.
    const meetsThreshold = otRaw >= policy.otMinMinutes;
    const otMinutes = meetsThreshold ? otRaw : 0;
    const overnightOtMinutes = meetsThreshold ? overnightRaw : 0;

    const closed = summaries.filter((s) => !s.isOpen);
    const isWorking = summaries.some((s) => s.isOpen && !s.isStale);
    const hasStale = summaries.some((s) => s.isStale);

    const firstCheckInAt = summaries.length > 0 ? summaries[0].checkInAt : null;
    const lastCheckOutAt = closed.reduce<Date | null>(
        (latest, s) =>
            s.checkOutAt !== null && (latest === null || s.checkOutAt > latest) ? s.checkOutAt : latest,
        null
    );

    return {
        workDate,
        workDateKey: workDateKey(workDate),
        sessions: summaries,
        workedMinutes: regularRaw + otRaw,
        regularMinutes: Math.min(regularRaw, policy.standardShiftMinutes),
        otMinutes,
        overnightOtMinutes,
        firstCheckInAt,
        lastCheckOutAt,
        isWorking,
        statuses: deriveStatuses({
            policy,
            summaries,
            firstCheckInAt,
            lastCheckOutAt,
            otMinutes,
            overnightOtMinutes,
            isWorking,
            hasStale,
        }),
    };
}

function deriveStatuses(input: {
    policy: AttendancePolicy;
    summaries: readonly SessionSummary[];
    firstCheckInAt: Date | null;
    lastCheckOutAt: Date | null;
    otMinutes: number;
    overnightOtMinutes: number;
    isWorking: boolean;
    hasStale: boolean;
}): DayStatus[] {
    const {policy, summaries, firstCheckInAt, lastCheckOutAt, otMinutes, overnightOtMinutes} = input;

    if (summaries.length === 0) {
        return ["ABSENT"];
    }

    const statuses: DayStatus[] = ["PRESENT"];

    if (input.isWorking) statuses.push("WORKING");
    if (input.hasStale) statuses.push("MISSING_CHECKOUT");

    if (firstCheckInAt !== null) {
        const lateAfter = localMinutesOfDay(
            boundaryAt(summaries[0].workDate, policy.lateAfterTime, policy),
            policy
        );
        const arrival = localMinutesOfDay(firstCheckInAt, policy);
        // Only a day shift can be "late" — a night shift has no morning to miss.
        if (summaries[0].kind === "DAY" && arrival > lateAfter) {
            statuses.push("LATE");
        }
    }

    if (lastCheckOutAt !== null && !input.isWorking && otMinutes === 0) {
        const shiftEnd = boundaryAt(summaries[0].workDate, policy.otStartTime, policy);
        if (lastCheckOutAt < shiftEnd) {
            statuses.push("EARLY_LEAVE");
        }
    }

    // An auto-closed session carries a time the system chose, not one anybody
    // tapped — say so until an admin has looked at it.
    if (summaries.some((s) => s.autoClosedAt && !s.reviewedAt)) statuses.push("AUTO_CLOSED");

    if (otMinutes > 0) statuses.push("OT");
    if (overnightOtMinutes > 0) statuses.push("OT_OVERNIGHT");

    return statuses;
}

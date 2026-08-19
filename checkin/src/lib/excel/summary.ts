import type {RangeRow} from "@/lib/attendance/queries";

/**
 * Per-person totals across the exported date range.
 *
 * Sums the DAY-level figures from each member-day, never the per-session ones:
 * session minutes are uncapped and an overnight shift contributes two rows, so
 * adding those would double-count and ignore the standard-shift cap.
 *
 * Pure — takes rows, returns totals.
 */

export interface MemberTotals {
    employeeCode: string | null;
    memberName: string;
    teamName: string;
    /** Days with at least one session. Absent days produce no row, so they are not counted. */
    daysWorked: number;
    workedMinutes: number;
    regularMinutes: number;
    otMinutes: number;
    overnightOtMinutes: number;
    missingCheckoutDays: number;
}

export function summarizeByMember(rows: readonly RangeRow[]): MemberTotals[] {
    const byMember = new Map<string, MemberTotals>();

    for (const row of rows) {
        const existing = byMember.get(row.memberId);
        const base: MemberTotals = existing ?? {
            employeeCode: row.employeeCode,
            memberName: row.memberName,
            teamName: row.teamName,
            daysWorked: 0,
            workedMinutes: 0,
            regularMinutes: 0,
            otMinutes: 0,
            overnightOtMinutes: 0,
            missingCheckoutDays: 0,
        };

        const has = (status: string) => row.day.statuses.includes(status as never);

        byMember.set(row.memberId, {
            ...base,
            // A member moved between teams mid-range reports their latest team;
            // rows arrive sorted by date, so the last one wins.
            teamName: row.teamName,
            daysWorked: base.daysWorked + 1,
            workedMinutes: base.workedMinutes + row.day.workedMinutes,
            regularMinutes: base.regularMinutes + row.day.regularMinutes,
            otMinutes: base.otMinutes + row.day.otMinutes,
            overnightOtMinutes: base.overnightOtMinutes + row.day.overnightOtMinutes,
            missingCheckoutDays: base.missingCheckoutDays + (has("MISSING_CHECKOUT") ? 1 : 0),
        });
    }

    return [...byMember.values()].sort(
        (a, b) =>
            a.teamName.localeCompare(b.teamName, "vi") ||
            a.memberName.localeCompare(b.memberName, "vi")
    );
}

/** Minutes as decimal hours, so the spreadsheet can sum and multiply them. */
export function toHours(minutes: number): number {
    return Math.round((minutes / 60) * 100) / 100;
}

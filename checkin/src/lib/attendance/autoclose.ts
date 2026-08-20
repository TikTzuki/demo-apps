import type {AttendancePolicy} from "./compute";
import {boundaryAt, businessDayEnd, MINUTE_MS, workDateOf} from "./time";

/**
 * Closing forgotten sessions, without paying people for forgetting.
 *
 * A session left open past the cutoff of its OWN business day is abandoned:
 * nobody is still working it, they simply never tapped out. Rather than leave
 * the day at zero hours (which quietly costs the employee a full day), the
 * system closes it at a defensible time and flags it for an admin.
 *
 * The credited time is deliberately NOT the moment of closing — that would hand
 * a forgotten 08:00 check-in twenty-one hours, most of it overtime.
 *
 * Pure functions; the caller supplies `now`.
 */

/** A session left open past its own business day's cutoff is abandoned, not running. */
export function shouldAutoClose(
    session: { workDate: Date; checkInAt: Date },
    policy: AttendancePolicy,
    now: Date
): boolean {
    return workDateOf(now, policy).getTime() > session.workDate.getTime();
}

/**
 * The check-out time a forgotten session is credited to:
 *
 * - the end of the normal shift (`otStartTime`) — so a forgotten day shift earns
 *   a normal day and NO overtime;
 * - the day cutoff, when the shift started after the normal shift had ended —
 *   a night shift keeps the overtime it genuinely worked.
 */
export function autoCloseAt(
    workDate: Date,
    checkInAt: Date,
    policy: AttendancePolicy
): Date {
    const shiftEnd = boundaryAt(workDate, policy.otStartTime, policy);
    if (shiftEnd.getTime() > checkInAt.getTime()) return shiftEnd;

    const cutoff = businessDayEnd(workDate, policy);

    // A session that somehow began after even the cutoff still needs a later
    // end than its start, or the row would be invalid.
    return cutoff.getTime() > checkInAt.getTime()
        ? cutoff
        : new Date(checkInAt.getTime() + MINUTE_MS);
}

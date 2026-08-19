import {prisma} from "@/lib/prisma";
import {autoCloseAt, shouldAutoClose} from "./autoclose";
import type {AttendancePolicy} from "./compute";
import {workDateOf} from "./time";

/**
 * Closes sessions abandoned on an earlier business day.
 *
 * Runs lazily off ordinary traffic rather than a scheduled job: the app is a
 * single pod with no scheduler, and a sweep that only fires when somebody is
 * using the system is enough — nothing depends on it happening at 05:00 sharp,
 * only on it having happened before anyone reads the numbers.
 */

const THROTTLE_MS = 5 * 60_000;
let lastSweptAt = 0;

async function sweep(policy: AttendancePolicy, now: Date): Promise<number> {
    const today = workDateOf(now, policy);

    const abandoned = await prisma.attendanceSession.findMany({
        where: {checkOutAt: null, workDate: {lt: today}},
        select: {id: true, workDate: true, checkInAt: true, note: true},
    });

    let closed = 0;
    for (const session of abandoned) {
        if (!shouldAutoClose(session, policy, now)) continue;

        // Conditional on still being open, so two concurrent sweeps cannot both
        // close the same row and one cannot overwrite a real check-out that
        // landed in between.
        const result = await prisma.attendanceSession.updateMany({
            where: {id: session.id, checkOutAt: null},
            data: {
                checkOutAt: autoCloseAt(session.workDate, session.checkInAt, policy),
                autoClosedAt: now,
                note: session.note ?? "Hệ thống tự đóng ca do quên check-out",
            },
        });
        closed += result.count;
    }

    if (closed > 0) {
        console.warn(`Auto-closed ${closed} abandoned attendance session(s)`);
    }
    return closed;
}

/** Sweep at most once every few minutes — safe to call from a polled endpoint. */
export async function sweepThrottled(policy: AttendancePolicy, now: Date): Promise<void> {
    if (now.getTime() - lastSweptAt < THROTTLE_MS) return;
    lastSweptAt = now.getTime();
    try {
        await sweep(policy, now);
    } catch (error) {
        // A failed sweep must never take down the kiosk board.
        console.error("Auto-close sweep failed:", error);
    }
}

/** Sweep now — used before a check-in, where a stale row would block the person. */
export async function sweepNow(policy: AttendancePolicy, now: Date): Promise<number> {
    lastSweptAt = now.getTime();
    return sweep(policy, now);
}

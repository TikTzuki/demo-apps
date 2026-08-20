import {type AttendancePolicy, classifyKind, computeDay} from "./compute";
import {formatHHmm, MINUTE_MS, parseHHmm, parseWorkDateKey} from "./time";

/**
 * Worked examples for the settings screen.
 *
 * Run through the REAL computation rather than restating the arithmetic: the
 * settings page previously hardcoded these numbers and they silently went stale
 * the moment the rules changed. Whatever the admin sets, these stay true.
 */

export interface PolicyExample {
    shift: string;
    regularMinutes: number;
    otMinutes: number;
}

/** A fixed reference day — only the policy's shape matters, not the date. */
const REFERENCE = parseWorkDateKey("2026-01-05");

/** Minutes past local midnight on the reference day, as a UTC instant. */
function at(minutes: number, policy: AttendancePolicy): Date {
    return new Date(
        REFERENCE.getTime() + minutes * MINUTE_MS - policy.timezoneOffsetMinutes * MINUTE_MS
    );
}

export function buildPolicyExamples(policy: AttendancePolicy): PolicyExample[] {
    const shiftStart = parseHHmm(policy.shiftStartTime);
    const otStart = parseHHmm(policy.otStartTime);
    const lateEvening = Math.max(otStart + 240, 22 * 60);
    const nightStart = parseHHmm(policy.overnightStartTime);

    const shifts: Array<{ label: string; legs: Array<[number, number]> }> = [
        {
            label: `${policy.shiftStartTime} → ${policy.otStartTime}`,
            legs: [[shiftStart, otStart]],
        },
        {
            label: `${policy.shiftStartTime} → ${formatHHmm(lateEvening)}`,
            legs: [[shiftStart, lateEvening]],
        },
        {
            // Goes home, then returns for a night shift running past midnight.
            label: `${policy.shiftStartTime} → ${formatHHmm(otStart + 30)}, quay lại ${formatHHmm(nightStart + 60)} → 02:00`,
            legs: [[shiftStart, otStart + 30], [nightStart + 60, 26 * 60]],
        },
    ];

    return shifts.map(({label, legs}) => {
        const day = computeDay(
            REFERENCE,
            legs.map(([from, to], i) => {
                const checkInAt = at(from, policy);
                return {
                    id: `example-${i}`,
                    workDate: REFERENCE,
                    checkInAt,
                    checkOutAt: at(to, policy),
                    kind: classifyKind(checkInAt, policy),
                };
            }),
            policy,
            at(30 * 60, policy) // well after the last leg, so nothing reads as open
        );

        return {shift: label, regularMinutes: day.regularMinutes, otMinutes: day.otMinutes};
    });
}

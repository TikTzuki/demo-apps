/**
 * Timezone-aware business-day helpers.
 *
 * Every instant is stored in UTC. The office runs on a fixed local offset
 * (Asia/Ho_Chi_Minh = UTC+7, no DST), so plain offset arithmetic is exact —
 * we never rely on the server's TZ environment.
 *
 * All functions here are pure.
 */

export const MINUTE_MS = 60_000;
export const HOUR_MS = 3_600_000;
export const DAY_MS = 86_400_000;

export interface TimePolicy {
    /** Minutes to add to UTC to get local wall-clock time. 420 = UTC+7. */
    timezoneOffsetMinutes: number;
    /** Local hour at which a new business day begins. A 22:00 → 02:00 shift belongs to the day it started. */
    dayCutoffHour: number;
}

/** "18:00" → 1080 minutes past local midnight. */
export function parseHHmm(value: string): number {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
    if (!match) {
        throw new Error(`Giờ không hợp lệ: "${value}" (định dạng HH:mm)`);
    }
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) {
        throw new Error(`Giờ không hợp lệ: "${value}"`);
    }
    return hours * 60 + minutes;
}

/** 1080 → "18:00". Minutes beyond a day wrap around. */
export function formatHHmm(minutesFromMidnight: number): string {
    const normalized = ((minutesFromMidnight % 1440) + 1440) % 1440;
    const hours = Math.floor(normalized / 60);
    const minutes = normalized % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Just the offset — all this formatter needs is where "local" is. */
export type OffsetPolicy = Pick<TimePolicy, "timezoneOffsetMinutes">;

/** Minutes elapsed since local midnight for the given instant. */
export function localMinutesOfDay(instant: Date, policy: OffsetPolicy): number {
    const localMs = instant.getTime() + policy.timezoneOffsetMinutes * MINUTE_MS;
    return Math.floor((((localMs % DAY_MS) + DAY_MS) % DAY_MS) / MINUTE_MS);
}

/**
 * The business day an instant belongs to, as a Date at UTC midnight.
 *
 * That representation is what Postgres `DATE` columns round-trip cleanly, and it
 * keeps the value stable regardless of where it is later formatted.
 */
export function workDateOf(instant: Date, policy: TimePolicy): Date {
    const localMs = instant.getTime() + policy.timezoneOffsetMinutes * MINUTE_MS;
    const shifted = localMs - policy.dayCutoffHour * HOUR_MS;
    return new Date(Math.floor(shifted / DAY_MS) * DAY_MS);
}

/**
 * The UTC instant of a local wall-clock time on a given business day.
 *
 * Times earlier than the cutoff hour (e.g. "02:00") land on the following
 * calendar day, because they still belong to this business day.
 */
export function boundaryAt(workDate: Date, hhmm: string, policy: TimePolicy): Date {
    const minutes = parseHHmm(hhmm);
    const rollsOver = minutes < policy.dayCutoffHour * 60 ? DAY_MS : 0;
    return new Date(
        workDate.getTime() + rollsOver + minutes * MINUTE_MS - policy.timezoneOffsetMinutes * MINUTE_MS
    );
}

/**
 * The instant a business day ends: the following day's cutoff.
 *
 * Nothing a session does after this belongs to that day — which is what bounds
 * overtime. With a midnight cutoff, work after 00:00 is the next day's problem.
 */
export function businessDayEnd(workDate: Date, policy: TimePolicy): Date {
    return new Date(
        workDate.getTime()
        + DAY_MS
        + policy.dayCutoffHour * HOUR_MS
        - policy.timezoneOffsetMinutes * MINUTE_MS
    );
}

/** A Date at UTC midnight → "YYYY-MM-DD". */
export function workDateKey(workDate: Date): string {
    return workDate.toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" → a Date at UTC midnight. */
export function parseWorkDateKey(key: string): Date {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) {
        throw new Error(`Ngày không hợp lệ: "${key}" (định dạng YYYY-MM-DD)`);
    }
    return new Date(`${key}T00:00:00.000Z`);
}

export function addDays(workDate: Date, days: number): Date {
    return new Date(workDate.getTime() + days * DAY_MS);
}

/** Every business day from `from` to `to`, inclusive. */
export function eachWorkDate(from: Date, to: Date): Date[] {
    const days: Date[] = [];
    for (let cursor = from.getTime(); cursor <= to.getTime(); cursor += DAY_MS) {
        days.push(new Date(cursor));
    }
    return days;
}

/** Minutes shared by two intervals. `null` bounds mean unbounded. */
export function overlapMinutes(
    aStart: Date,
    aEnd: Date,
    bStart: Date | null,
    bEnd: Date | null
): number {
    const start = Math.max(aStart.getTime(), bStart?.getTime() ?? -Infinity);
    const end = Math.min(aEnd.getTime(), bEnd?.getTime() ?? Infinity);
    return end <= start ? 0 : Math.round((end - start) / MINUTE_MS);
}

/** "HH:mm" in local time. */
export function localTimeLabel(instant: Date, policy: OffsetPolicy): string {
    return formatHHmm(localMinutesOfDay(instant, policy));
}

/** "DD/MM/YYYY HH:mm" in local time — the format Vietnamese spreadsheets expect. */
export function localDateTimeLabel(instant: Date, policy: OffsetPolicy): string {
    const local = new Date(instant.getTime() + policy.timezoneOffsetMinutes * MINUTE_MS);
    const day = String(local.getUTCDate()).padStart(2, "0");
    const month = String(local.getUTCMonth() + 1).padStart(2, "0");
    return `${day}/${month}/${local.getUTCFullYear()} ${localTimeLabel(instant, policy)}`;
}

/** "DD/MM/YYYY" for a business day. */
export function workDateLabel(workDate: Date): string {
    const day = String(workDate.getUTCDate()).padStart(2, "0");
    const month = String(workDate.getUTCMonth() + 1).padStart(2, "0");
    return `${day}/${month}/${workDate.getUTCFullYear()}`;
}

/** Total minutes → "8h30" / "45p" / "0". */
export function formatDuration(minutes: number): string {
    if (minutes <= 0) return "0";
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (hours === 0) return `${rest}p`;
    if (rest === 0) return `${hours}h`;
    return `${hours}h${String(rest).padStart(2, "0")}`;
}

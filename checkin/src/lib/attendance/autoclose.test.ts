import {describe, expect, it} from "vitest";
import {autoCloseAt, shouldAutoClose} from "./autoclose";
import {DEFAULT_POLICY} from "./compute";
import {parseWorkDateKey} from "./time";

const local = (day: string, hhmm: string) => new Date(`${day}T${hhmm}:00.000+07:00`);
const DAY = parseWorkDateKey("2026-08-19");

describe("autoCloseAt — what time a forgotten session is credited to", () => {
    it("credits a forgotten day shift to the end of the normal shift, never OT", () => {
        const at = autoCloseAt(DAY, local("2026-08-19", "08:00"), DEFAULT_POLICY);
        expect(at.toISOString()).toBe(local("2026-08-19", "18:00").toISOString());
    });

    it("does the same however early they arrived", () => {
        const at = autoCloseAt(DAY, local("2026-08-19", "06:30"), DEFAULT_POLICY);
        expect(at.toISOString()).toBe(local("2026-08-19", "18:00").toISOString());
    });

    it("credits a night shift to the 05:00 day cutoff", () => {
        const at = autoCloseAt(DAY, local("2026-08-19", "22:00"), DEFAULT_POLICY);
        expect(at.toISOString()).toBe(local("2026-08-20", "05:00").toISOString());
    });

    it("uses the cutoff for anyone who started after the shift already ended", () => {
        // Started at 19:00 — 18:00 is behind them, so the shift end cannot apply.
        const at = autoCloseAt(DAY, local("2026-08-19", "19:00"), DEFAULT_POLICY);
        expect(at.toISOString()).toBe(local("2026-08-20", "05:00").toISOString());
    });

    it("never produces a check-out at or before the check-in", () => {
        for (const hhmm of ["00:30", "06:00", "12:00", "17:59", "18:01", "23:59"]) {
            const checkIn = local("2026-08-19", hhmm);
            expect(autoCloseAt(DAY, checkIn, DEFAULT_POLICY).getTime()).toBeGreaterThan(checkIn.getTime());
        }
    });
});

describe("shouldAutoClose — only genuinely abandoned sessions", () => {
    const cutoffPassed = local("2026-08-20", "05:30");

    it("leaves today's open session alone", () => {
        expect(shouldAutoClose(
            {workDate: parseWorkDateKey("2026-08-20"), checkInAt: local("2026-08-20", "08:00")},
            DEFAULT_POLICY, local("2026-08-20", "14:00")
        )).toBe(false);
    });

    it("leaves a night shift alone while it is still running", () => {
        // 23:00 on the 19th, checked at 02:00 — still the 19th's business day.
        expect(shouldAutoClose(
            {workDate: DAY, checkInAt: local("2026-08-19", "23:00")},
            DEFAULT_POLICY, local("2026-08-20", "02:00")
        )).toBe(false);
    });

    it("closes a session left open past the cutoff of its own business day", () => {
        expect(shouldAutoClose(
            {workDate: DAY, checkInAt: local("2026-08-19", "08:00")},
            DEFAULT_POLICY, cutoffPassed
        )).toBe(true);
    });

    it("closes a night shift that was never ended", () => {
        expect(shouldAutoClose(
            {workDate: DAY, checkInAt: local("2026-08-19", "22:00")},
            DEFAULT_POLICY, local("2026-08-21", "09:00")
        )).toBe(true);
    });
});

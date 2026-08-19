import {describe, expect, it} from "vitest";
import {computeDay, DEFAULT_POLICY, type AttendancePolicy, type SessionInput} from "./compute";
import {parseWorkDateKey} from "./time";

const WORK_DATE = parseWorkDateKey("2026-08-19");

/** Build a UTC instant from a local (UTC+7) wall-clock time on the given day. */
function local(day: string, hhmm: string): Date {
    return new Date(`${day}T${hhmm}:00.000+07:00`);
}

function session(overrides: Partial<SessionInput> & { checkInAt: Date }): SessionInput {
    return {
        id: "s1",
        workDate: WORK_DATE,
        checkOutAt: null,
        kind: "DAY",
        isManual: false,
        ...overrides,
    };
}

/** A moment well after the work date, so nothing is still "in progress". */
const AFTER = local("2026-08-21", "09:00");

function day(sessions: SessionInput[], policy: AttendancePolicy = DEFAULT_POLICY, now = AFTER) {
    return computeDay(WORK_DATE, sessions, policy, now);
}

describe("computeDay — the shifts described in the brief", () => {
    it("treats a normal 08:00 → 18:00 day as a full shift with no OT", () => {
        const result = day([
            session({checkInAt: local("2026-08-19", "08:00"), checkOutAt: local("2026-08-19", "18:00")}),
        ]);

        // 10h on the clock minus the 90-minute break = 8.5h, capped at the 8h standard shift.
        expect(result.regularMinutes).toBe(480);
        expect(result.otMinutes).toBe(0);
        expect(result.overnightOtMinutes).toBe(0);
        expect(result.statuses).toContain("PRESENT");
        expect(result.statuses).not.toContain("OT");
    });

    it("gives exactly 4h OT for a 08:00 → 22:00 day", () => {
        const result = day([
            session({checkInAt: local("2026-08-19", "08:00"), checkOutAt: local("2026-08-19", "22:00")}),
        ]);

        expect(result.regularMinutes).toBe(480);
        expect(result.otMinutes).toBe(240);
        expect(result.overnightOtMinutes).toBe(0);
        expect(result.statuses).toContain("OT");
    });

    it("counts an evening leg between 19:00 and 22:00 as OT measured from 18:00", () => {
        const result = day([
            session({checkInAt: local("2026-08-19", "09:00"), checkOutAt: local("2026-08-19", "19:30")}),
        ]);

        expect(result.otMinutes).toBe(90);
        expect(result.statuses).toContain("OT");
    });

    it("splits an overnight return into its own OT bucket", () => {
        const result = day([
            session({
                id: "day",
                checkInAt: local("2026-08-19", "08:00"),
                checkOutAt: local("2026-08-19", "18:30"),
            }),
            session({
                id: "night",
                kind: "OVERNIGHT",
                checkInAt: local("2026-08-19", "22:00"),
                checkOutAt: local("2026-08-20", "02:00"),
            }),
        ]);

        expect(result.regularMinutes).toBe(480);
        expect(result.otMinutes).toBe(30 + 240);
        expect(result.overnightOtMinutes).toBe(240);
        expect(result.statuses).toContain("OT_OVERNIGHT");
        expect(result.sessions).toHaveLength(2);
    });
});

describe("computeDay — thresholds and edges", () => {
    it("discards OT below the minimum threshold", () => {
        const result = day([
            session({checkInAt: local("2026-08-19", "08:00"), checkOutAt: local("2026-08-19", "18:10")}),
        ]);

        expect(result.otMinutes).toBe(0);
        expect(result.statuses).not.toContain("OT");
    });

    it("keeps OT that exactly meets the threshold", () => {
        const result = day([
            session({checkInAt: local("2026-08-19", "08:00"), checkOutAt: local("2026-08-19", "18:30")}),
        ]);

        expect(result.otMinutes).toBe(30);
    });

    it("caps regular minutes at the standard shift however early someone arrives", () => {
        const result = day([
            session({checkInAt: local("2026-08-19", "06:00"), checkOutAt: local("2026-08-19", "18:00")}),
        ]);

        expect(result.regularMinutes).toBe(480);
        expect(result.workedMinutes).toBeGreaterThan(480);
    });

    it("deducts the break only from a day that actually spans it", () => {
        const morning = day([
            session({checkInAt: local("2026-08-19", "08:00"), checkOutAt: local("2026-08-19", "11:00")}),
        ]);
        expect(morning.regularMinutes).toBe(180);

        const acrossLunch = day([
            session({checkInAt: local("2026-08-19", "08:00"), checkOutAt: local("2026-08-19", "14:00")}),
        ]);
        expect(acrossLunch.regularMinutes).toBe(360 - 90);
    });

    it("flags a late arrival", () => {
        const result = day([
            session({checkInAt: local("2026-08-19", "10:30"), checkOutAt: local("2026-08-19", "18:00")}),
        ]);

        expect(result.statuses).toContain("LATE");
    });

    it("flags leaving before the end of the shift", () => {
        const result = day([
            session({checkInAt: local("2026-08-19", "08:00"), checkOutAt: local("2026-08-19", "15:00")}),
        ]);

        expect(result.statuses).toContain("EARLY_LEAVE");
    });

    it("reports an absent member", () => {
        const result = day([]);

        expect(result.statuses).toEqual(["ABSENT"]);
        expect(result.workedMinutes).toBe(0);
        expect(result.firstCheckInAt).toBeNull();
    });

    it("reports someone still on the clock as working, not as missing a check-out", () => {
        const result = day(
            [session({checkInAt: local("2026-08-19", "08:00")})],
            DEFAULT_POLICY,
            local("2026-08-19", "14:00")
        );

        expect(result.isWorking).toBe(true);
        expect(result.statuses).toContain("WORKING");
        expect(result.statuses).not.toContain("MISSING_CHECKOUT");
    });

    it("never invents a check-out for a session left open too long", () => {
        const result = day([session({checkInAt: local("2026-08-19", "08:00")})]);

        expect(result.statuses).toContain("MISSING_CHECKOUT");
        expect(result.workedMinutes).toBe(0);
        expect(result.sessions[0].checkOutAt).toBeNull();
    });
});

describe("workDate attribution", () => {
    it("keeps a session that crosses midnight on the day it started", async () => {
        const {workDateOf} = await import("./time");

        expect(workDateOf(local("2026-08-19", "22:00"), DEFAULT_POLICY).toISOString()).toBe(
            "2026-08-19T00:00:00.000Z"
        );
        expect(workDateOf(local("2026-08-20", "02:00"), DEFAULT_POLICY).toISOString()).toBe(
            "2026-08-19T00:00:00.000Z"
        );
        // Past the 05:00 cutoff a new business day has begun.
        expect(workDateOf(local("2026-08-20", "06:00"), DEFAULT_POLICY).toISOString()).toBe(
            "2026-08-20T00:00:00.000Z"
        );
    });
});

describe("classifyKind", () => {
    it("separates a night shift from working late", async () => {
        const {classifyKind} = await import("./compute");

        expect(classifyKind(local("2026-08-19", "08:00"), DEFAULT_POLICY)).toBe("DAY");
        expect(classifyKind(local("2026-08-19", "19:00"), DEFAULT_POLICY)).toBe("DAY");
        expect(classifyKind(local("2026-08-19", "21:00"), DEFAULT_POLICY)).toBe("OVERNIGHT");
        expect(classifyKind(local("2026-08-19", "23:30"), DEFAULT_POLICY)).toBe("OVERNIGHT");
        // 02:00 is the tail of last night's shift, not a new day shift.
        expect(classifyKind(local("2026-08-20", "02:00"), DEFAULT_POLICY)).toBe("OVERNIGHT");
    });
});

import {describe, expect, it} from "vitest";
import {type AttendancePolicy, computeDay, DEFAULT_POLICY, type SessionInput} from "./compute";
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
        expect(result.statuses).toContain("PRESENT");
        expect(result.statuses).not.toContain("OT");
    });

    it("gives exactly 4h OT for a 08:00 → 22:00 day", () => {
        const result = day([
            session({checkInAt: local("2026-08-19", "08:00"), checkOutAt: local("2026-08-19", "22:00")}),
        ]);

        expect(result.regularMinutes).toBe(480);
        expect(result.otMinutes).toBe(240);
        expect(result.statuses).toContain("OT");
    });

    it("counts an evening leg between 19:00 and 22:00 as OT measured from 18:00", () => {
        const result = day([
            session({checkInAt: local("2026-08-19", "09:00"), checkOutAt: local("2026-08-19", "19:30")}),
        ]);

        expect(result.otMinutes).toBe(90);
        expect(result.statuses).toContain("OT");
    });

    it("adds a night return to the day's overtime, capped at midnight", () => {
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
        // 18:00→18:30 is 30 minutes; the night leg counts 22:00→00:00 only —
        // the two hours past midnight belong to the next business day. Night
        // overtime is not tallied apart: it is the same rate.
        expect(result.otMinutes).toBe(30 + 120);
        expect(result.statuses).toContain("OT");
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
    it("ends the business day at midnight", async () => {
        const {workDateOf} = await import("./time");

        expect(workDateOf(local("2026-08-19", "22:00"), DEFAULT_POLICY).toISOString()).toBe(
            "2026-08-19T00:00:00.000Z"
        );
        // Midnight starts a new business day, so work past it is the next day's.
        expect(workDateOf(local("2026-08-20", "02:00"), DEFAULT_POLICY).toISOString()).toBe(
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
        // With a midnight cutoff there is no "tail of last night": 02:00 opens a
        // new business day, so it is that day's shift.
        expect(classifyKind(local("2026-08-20", "02:00"), DEFAULT_POLICY)).toBe("DAY");
    });
});

describe("day cutoff at midnight — max 6h OT per day", () => {
    const MIDNIGHT: typeof DEFAULT_POLICY = {...DEFAULT_POLICY, dayCutoffHour: 0};

    function dayAt(policy: typeof DEFAULT_POLICY, sessions: SessionInput[]) {
        return computeDay(WORK_DATE, sessions, policy, AFTER);
    }

    it("caps OT at the 18:00→24:00 window for a shift running past midnight", () => {
        // Worked 08:00 until 02:00 the next morning.
        const result = dayAt(MIDNIGHT, [
            session({
                checkInAt: local("2026-08-19", "08:00"),
                checkOutAt: new Date("2026-08-20T02:00:00.000+07:00"),
            }),
        ]);

        // 18:00 → 00:00 is six hours; the two hours past midnight belong to the
        // next business day, not this one.
        expect(result.otMinutes).toBe(360);
    });

    it("still gives 4h for an ordinary 08:00 → 22:00 day", () => {
        const result = dayAt(MIDNIGHT, [
            session({checkInAt: local("2026-08-19", "08:00"), checkOutAt: local("2026-08-19", "22:00")}),
        ]);

        expect(result.otMinutes).toBe(240);
    });
});

describe("night shift crossing midnight", () => {
    it("counts 22:00 → 02:00 as 2h OT, measured 22:00 → 00:00", () => {
        const result = day([
            session({
                kind: "OVERNIGHT",
                checkInAt: local("2026-08-19", "22:00"),
                checkOutAt: new Date("2026-08-20T02:00:00.000+07:00"),
            }),
        ]);

        // The two hours after midnight fall in the next business day and are
        // not credited here — 22:00 → 00:00 is the whole of it.
        expect(result.otMinutes).toBe(120);
        expect(result.regularMinutes).toBe(0);
        expect(result.workedMinutes).toBe(120);
    });

    it("gives the same 2h whether the shift ends at 02:00 or 05:00", () => {
        const at = (end: string) => day([
            session({
                kind: "OVERNIGHT",
                checkInAt: local("2026-08-19", "22:00"),
                checkOutAt: new Date(`2026-08-20T${end}:00.000+07:00`),
            }),
        ]).otMinutes;

        expect(at("02:00")).toBe(120);
        expect(at("05:00")).toBe(120);
    });
});

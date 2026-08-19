import {describe, expect, it} from "vitest";
import {summarizeByMember, toHours} from "./summary";
import {computeDay, DEFAULT_POLICY, type SessionInput} from "@/lib/attendance/compute";
import {parseWorkDateKey} from "@/lib/attendance/time";
import type {RangeRow} from "@/lib/attendance/queries";

const AFTER = new Date("2026-09-01T00:00:00.000Z");

function local(day: string, hhmm: string): Date {
    return new Date(`${day}T${hhmm}:00.000+07:00`);
}

/** A member-day built through the real computation, as getRange() produces it. */
function dayRow(
    memberId: string,
    memberName: string,
    teamName: string,
    dayKey: string,
    sessions: Array<[string, string | null, "DAY" | "OVERNIGHT"]>
): RangeRow {
    const workDate = parseWorkDateKey(dayKey);
    const inputs: SessionInput[] = sessions.map(([start, end, kind], i) => ({
        id: `${memberId}-${dayKey}-${i}`,
        workDate,
        checkInAt: local(dayKey, start),
        checkOutAt: end ? new Date(`${end}+07:00`) : null,
        kind,
        isManual: false,
    }));

    return {
        workDate,
        teamName,
        teamColor: "#000",
        memberId,
        memberName,
        employeeCode: memberId,
        day: computeDay(workDate, inputs, DEFAULT_POLICY, AFTER),
    };
}

describe("summarizeByMember", () => {
    it("adds up each person's days across the range", () => {
        const totals = summarizeByMember([
            dayRow("E1", "An", "Platform", "2026-08-19", [["08:00", "2026-08-19T18:00", "DAY"]]),
            dayRow("E1", "An", "Platform", "2026-08-20", [["08:00", "2026-08-20T22:00", "DAY"]]),
        ]);

        expect(totals).toHaveLength(1);
        expect(totals[0]).toMatchObject({
            employeeCode: "E1",
            daysWorked: 2,
            regularMinutes: 960,   // 8h + 8h
            otMinutes: 240,        // 0 + 4h
            overnightOtMinutes: 0,
        });
    });

    it("counts an overnight day once, not once per session", () => {
        const totals = summarizeByMember([
            dayRow("E1", "An", "Platform", "2026-08-19", [
                ["08:00", "2026-08-19T18:30", "DAY"],
                ["22:00", "2026-08-20T02:00", "OVERNIGHT"],
            ]),
        ]);

        // Two sessions, one business day.
        expect(totals[0].daysWorked).toBe(1);
        expect(totals[0].regularMinutes).toBe(480);
        expect(totals[0].otMinutes).toBe(30 + 240);
        expect(totals[0].overnightOtMinutes).toBe(240);
    });

    it("keeps people separate and sorts by team then name", () => {
        const totals = summarizeByMember([
            dayRow("E2", "Bình", "Solutions", "2026-08-19", [["08:00", "2026-08-19T18:00", "DAY"]]),
            dayRow("E1", "An", "Platform", "2026-08-19", [["08:00", "2026-08-19T18:00", "DAY"]]),
            dayRow("E3", "Cường", "Platform", "2026-08-19", [["08:00", "2026-08-19T18:00", "DAY"]]),
        ]);

        expect(totals.map((t) => `${t.teamName}/${t.memberName}`)).toEqual([
            "Platform/An", "Platform/Cường", "Solutions/Bình",
        ]);
    });

    it("tallies missing-checkout days, and does not report late or early leave", () => {
        const totals = summarizeByMember([
            dayRow("E1", "An", "Platform", "2026-08-19", [["10:30", "2026-08-19T18:00", "DAY"]]),
            dayRow("E1", "An", "Platform", "2026-08-20", [["08:00", "2026-08-20T15:00", "DAY"]]),
            dayRow("E1", "An", "Platform", "2026-08-21", [["08:00", null, "DAY"]]),
        ]);

        expect(totals[0]).toMatchObject({daysWorked: 3, missingCheckoutDays: 1});
        // Late / early-leave are deliberately not surfaced in the export.
        expect(totals[0]).not.toHaveProperty("lateDays");
        expect(totals[0]).not.toHaveProperty("earlyLeaveDays");
    });

    it("returns nothing for an empty range", () => {
        expect(summarizeByMember([])).toEqual([]);
    });
});

describe("toHours", () => {
    it("converts minutes to decimal hours Excel can add up", () => {
        expect(toHours(480)).toBe(8);
        expect(toHours(510)).toBe(8.5);
        expect(toHours(245)).toBe(4.08);
        expect(toHours(0)).toBe(0);
    });
});

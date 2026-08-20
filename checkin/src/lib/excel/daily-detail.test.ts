import {describe, expect, it} from "vitest";
import * as XLSX from "xlsx";
import {buildDailyDetailWorkbook} from "./daily-detail";
import {computeDay, DEFAULT_POLICY, type SessionInput} from "@/lib/attendance/compute";
import {parseWorkDateKey} from "@/lib/attendance/time";
import type {RangeRow} from "@/lib/attendance/queries";

const AFTER = new Date("2026-09-01T00:00:00.000Z");
const local = (day: string, hhmm: string) => new Date(`${day}T${hhmm}:00.000+07:00`);

function dayRow(
    id: string, name: string, team: string, dayKey: string,
    sessions: Array<[string, string | null, "DAY" | "OVERNIGHT"]>
): RangeRow {
    const workDate = parseWorkDateKey(dayKey);
    const inputs: SessionInput[] = sessions.map(([start, end, kind], i) => ({
        id: `${id}-${dayKey}-${i}`, workDate, checkInAt: local(dayKey, start),
        checkOutAt: end ? new Date(`${end}+07:00`) : null, kind, isManual: false,
    }));
    return {
        workDate, teamName: team, teamColor: "#000", memberId: id, memberName: name,
        employeeCode: id, day: computeDay(workDate, inputs, DEFAULT_POLICY, AFTER),
    };
}

const ROWS: RangeRow[] = [
    dayRow("E1", "Lộc", "Platform", "2026-08-19", [["08:00", "2026-08-19T18:00", "DAY"]]),
    dayRow("E1", "Lộc", "Platform", "2026-08-20", [["08:00", "2026-08-20T22:00", "DAY"]]),
    dayRow("E2", "Tính", "Platform", "2026-08-19", [
        ["08:00", "2026-08-19T18:30", "DAY"],
        ["22:00", "2026-08-20T02:00", "OVERNIGHT"],
    ]),
];

const RANGE = {from: parseWorkDateKey("2026-08-19"), to: parseWorkDateKey("2026-08-20")};

function read(rows: RangeRow[]) {
    const wb = XLSX.read(buildDailyDetailWorkbook(rows, DEFAULT_POLICY, RANGE), {type: "buffer"});
    const grid = (name: string) =>
        XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], {header: 1, blankrows: false});
    return {wb, grid};
}

describe("buildDailyDetailWorkbook", () => {
    it("produces the detail sheet and the summary sheet, in that order", () => {
        const {wb} = read(ROWS);
        expect(wb.SheetNames).toEqual(["Chi tiết chấm công", "Tổng công"]);
    });

    it("writes one summary row per person, whatever their session count", () => {
        const {grid} = read(ROWS);
        const summary = grid("Tổng công");
        const header = summary.findIndex((r) => r[0] === "Mã NV");
        const people = summary.slice(header + 1).filter((r) => r[0] !== "");

        // Same team, so name order decides: "Lộc" before "Tính".
        expect(people.map((r) => r[0])).toEqual(["E1", "E2"]);
        expect(people[0][3]).toBe(2);
        // E2 worked two sessions on one business day — still a single day of work.
        expect(people[1][3]).toBe(1);
    });

    it("reports hours as numbers so the sheet can sum them", () => {
        const {grid} = read(ROWS);
        const summary = grid("Tổng công");
        const header = summary.findIndex((r) => r[0] === "Mã NV");
        const e1 = summary.slice(header + 1).find((r) => r[0] === "E1")!;

        // 8h + 8h regular, 0 + 4h OT — as numbers, not "16h" strings.
        expect(e1[5]).toBe(16);
        expect(e1[6]).toBe(4);
        expect(typeof e1[5]).toBe("number");
    });

    it("closes with a grand total that matches the per-person rows", () => {
        const {grid} = read(ROWS);
        const summary = grid("Tổng công");
        const total = summary.find((r) => String(r[1]).startsWith("TỔNG"))!;
        const header = summary.findIndex((r) => r[0] === "Mã NV");
        const people = summary.slice(header + 1).filter((r) => r[0] !== "");

        for (const col of [3, 4, 5, 6, 7, 8]) {
            const sum = people.reduce((n, r) => n + Number(r[col]), 0);
            expect(total[col]).toBeCloseTo(sum, 2);
        }
    });

    it("still emits both sheets when the range is empty", () => {
        const {wb, grid} = read([]);
        expect(wb.SheetNames).toEqual(["Chi tiết chấm công", "Tổng công"]);
        // Header present, no people, and no misleading zero-total row.
        expect(grid("Tổng công").some((r) => String(r[1]).startsWith("TỔNG"))).toBe(false);
    });
});

describe("hidden statuses", () => {
    it("omits late and early-leave from the detail sheet's status column", () => {
        const late = dayRow("E9", "Muộn", "Solutions", "2026-08-19",
            [["10:30", "2026-08-19T15:00", "DAY"]]);
        const {grid} = read([late]);

        const detail = grid("Chi tiết chấm công");
        const header = detail.findIndex((r) => r[0] === "Ngày công");
        const statusCol = (detail[header] as string[]).indexOf("Trạng thái");
        const status = String(detail[header + 1][statusCol]);

        expect(status).toBe("Có mặt");
        expect(status).not.toContain("Đi muộn");
        expect(status).not.toContain("Về sớm");
    });

    it("keeps the statuses that still matter", () => {
        const {grid} = read(ROWS);
        const detail = grid("Chi tiết chấm công");
        const joined = detail.map((r) => String(r[15] ?? "")).join(" | ");

        // The overnight column is gone from the export — only total OT matters.
        expect(joined).not.toContain("Đi muộn");
    });
});

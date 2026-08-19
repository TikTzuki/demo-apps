import {describe, expect, it} from "vitest";
import * as XLSX from "xlsx";
import {parseRoster} from "./parse";

/** Build a real .xlsx buffer, the way an HR export arrives. */
function xlsx(rows: unknown[][]): Buffer {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Sheet1");
    return XLSX.write(wb, {type: "buffer", bookType: "xlsx"});
}

function csv(text: string): Buffer {
    return Buffer.from(text, "utf8");
}

describe("parseRoster", () => {
    it("reads a Vietnamese-headed sheet", () => {
        const {rows, issues} = parseRoster(xlsx([
            ["Mã NV", "Họ tên", "Phòng ban", "Email"],
            ["NV001", "Nguyễn Văn A", "Phòng Kỹ thuật", "a@newera.inc"],
            ["NV002", "Trần Thị B", "Phòng Kế toán", ""],
        ]));

        expect(issues).toEqual([]);
        expect(rows).toHaveLength(2);
        expect(rows[0]).toMatchObject({
            employeeCode: "NV001", name: "Nguyễn Văn A",
            teamName: "Phòng Kỹ thuật", email: "a@newera.inc",
        });
        expect(rows[1].email).toBeUndefined();
    });

    it("reads English headers and CSV just the same", () => {
        const {rows, issues} = parseRoster(csv(
            "Employee Code,Full Name,Department,Email\nE-9,Jane Doe,Engineering,jane@x.io\n"
        ));

        expect(issues).toEqual([]);
        expect(rows[0]).toMatchObject({employeeCode: "E-9", name: "Jane Doe", teamName: "Engineering"});
    });

    it("skips title rows above the real header", () => {
        const {rows, issues} = parseRoster(xlsx([
            ["DANH SÁCH NHÂN VIÊN 2026"],
            [],
            ["Mã NV", "Họ tên", "Phòng ban"],
            ["NV001", "Nguyễn Văn A", "Kỹ thuật"],
        ]));

        expect(issues).toEqual([]);
        expect(rows).toHaveLength(1);
        expect(rows[0].rowNumber).toBe(4);
    });

    it("trims whitespace and ignores blank padding rows", () => {
        const {rows, issues} = parseRoster(xlsx([
            ["Mã NV", "Họ tên", "Phòng ban"],
            ["  NV001  ", "  Nguyễn Văn A  ", " Kỹ thuật "],
            ["", "", ""],
            [],
        ]));

        expect(issues).toEqual([]);
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({employeeCode: "NV001", name: "Nguyễn Văn A", teamName: "Kỹ thuật"});
    });

    it("reports each bad row by its spreadsheet line number, and keeps the good ones", () => {
        const {rows, issues} = parseRoster(xlsx([
            ["Mã NV", "Họ tên", "Phòng ban", "Email"],
            ["NV001", "Hợp lệ", "Kỹ thuật", ""],
            ["", "Thiếu mã", "Kỹ thuật", ""],
            ["NV003", "", "Kỹ thuật", ""],
            ["NV004", "Thiếu phòng", "", ""],
            ["NV005", "Email sai", "Kỹ thuật", "not-an-email"],
            ["NV006", "Hợp lệ 2", "Kế toán", ""],
        ]));

        expect(rows.map((r) => r.employeeCode)).toEqual(["NV001", "NV006"]);
        expect(issues.map((i) => i.rowNumber)).toEqual([3, 4, 5, 6]);
        expect(issues[0].message).toContain("Thiếu mã nhân viên");
        expect(issues[1].message).toContain("Thiếu họ tên");
        expect(issues[2].message).toContain("Thiếu phòng ban");
        expect(issues[3].message).toContain("Email không hợp lệ");
    });

    it("rejects a duplicate employee code within the file, naming the first row", () => {
        const {rows, issues} = parseRoster(xlsx([
            ["Mã NV", "Họ tên", "Phòng ban"],
            ["NV001", "Người A", "Kỹ thuật"],
            ["nv001", "Người B", "Kế toán"],
        ]));

        expect(rows).toHaveLength(1);
        expect(issues[0].message).toContain("trùng với dòng 2");
    });

    it("explains itself when the header cannot be found", () => {
        const {rows, issues} = parseRoster(xlsx([
            ["foo", "bar"],
            ["1", "2"],
        ]));

        expect(rows).toEqual([]);
        expect(issues[0].message).toContain("Không tìm thấy dòng tiêu đề");
    });

    it("does not throw on an empty or unreadable file", () => {
        expect(parseRoster(Buffer.alloc(0)).issues.length).toBeGreaterThan(0);
        expect(parseRoster(Buffer.from("not a spreadsheet at all")).issues.length).toBeGreaterThan(0);
    });
});

describe("parseRoster — file encodings", () => {
    it("reads a UTF-8 CSV with Vietnamese headers", () => {
        // Passing CSV bytes straight to SheetJS decodes them as Latin-1, which
        // mangles "Mã NV" into "MÃ£ NV" and loses every column.
        const {rows, issues} = parseRoster(csv(
            "Mã NV,Họ tên,Phòng ban,Email\nNV001,Nguyễn Văn An,Phòng Kỹ thuật,an@newera.inc\n"
        ));

        expect(issues).toEqual([]);
        expect(rows[0]).toMatchObject({
            employeeCode: "NV001", name: "Nguyễn Văn An", teamName: "Phòng Kỹ thuật",
        });
    });

    it("strips a UTF-8 BOM, which Excel writes when saving as CSV", () => {
        const {rows, issues} = parseRoster(csv(
            "﻿Mã NV,Họ tên,Phòng ban\nNV001,Nguyễn Văn An,Kỹ thuật\n"
        ));

        expect(issues).toEqual([]);
        expect(rows[0].employeeCode).toBe("NV001");
    });

    it("still reads a real .xlsx after the format sniffing", () => {
        const {rows} = parseRoster(xlsx([
            ["Mã NV", "Họ tên", "Phòng ban"],
            ["NV001", "Nguyễn Văn An", "Kỹ thuật"],
        ]));

        expect(rows[0].name).toBe("Nguyễn Văn An");
    });
});

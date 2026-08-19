import * as XLSX from "xlsx";

/**
 * Reads an HR roster export (.xlsx, .xls or .csv) into validated rows.
 *
 * Pure: takes bytes, returns data. No database, no filesystem — so every
 * malformed-spreadsheet case can be covered in tests.
 */

export interface RosterRow {
    /** 1-based row number as it appears in the spreadsheet, for error messages. */
    rowNumber: number;
    employeeCode: string;
    name: string;
    teamName: string;
    email?: string;
}

export interface RosterIssue {
    rowNumber: number;
    message: string;
}

export interface ParsedRoster {
    rows: RosterRow[];
    issues: RosterIssue[];
}

/** Header spellings we accept, per field. Compared after accent/case stripping. */
const HEADER_ALIASES: Record<keyof Omit<RosterRow, "rowNumber">, string[]> = {
    employeeCode: [
        "ma nv", "ma nhan vien", "manv", "employee code", "employeecode", "code", "ma so",
        // Newera's HR export writes this as "E. C".
        "e c", "ec", "employee no", "ma nhan su",
    ],
    name: ["ho ten", "ten", "ho va ten", "name", "full name", "fullname", "nhan vien", "employee"],
    // Order matters: when an export carries both a fine-grained department and a
    // coarse division, the first matching COLUMN wins, so put the narrower
    // concepts first and let column order in the file break the tie.
    teamName: ["doi", "phong ban", "phong", "bo phan", "team", "department", "dept", "nhom", "division"],
    email: ["email", "e-mail", "mail", "thu dien tu"],
};

const MAX_ROWS = 5000;

/** ZIP header — every .xlsx is a zip archive. */
const XLSX_MAGIC = [0x50, 0x4b];
/** OLE2 compound-file header — legacy .xls. */
const XLS_MAGIC = [0xd0, 0xcf, 0x11, 0xe0];

function startsWith(bytes: Uint8Array, magic: readonly number[]): boolean {
    return magic.every((byte, i) => bytes[i] === byte);
}

/**
 * Hand SheetJS the right input type.
 *
 * Binary workbooks must go in as bytes, but a CSV given as bytes is decoded as
 * Latin-1 — which turns "Mã NV" into "MÃ£ NV" and loses every Vietnamese header.
 * So text formats are decoded as UTF-8 (minus any BOM) and passed as a string.
 */
function readWorkbook(bytes: Uint8Array): XLSX.WorkBook {
    if (startsWith(bytes, XLSX_MAGIC) || startsWith(bytes, XLS_MAGIC)) {
        return XLSX.read(bytes, {type: "array"});
    }
    const text = new TextDecoder("utf-8").decode(bytes).replace(/^\uFEFF/, "");
    return XLSX.read(text, {type: "string"});
}

/** "Phòng Kỹ thuật" -> "phong ky thuat", so header matching survives accents and case. */
function normalizeHeader(value: unknown): string {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/đ/gi, "d")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function cell(value: unknown): string {
    return String(value ?? "").trim();
}

/** Map each wanted field to the column index whose header matches an alias. */
function mapColumns(header: readonly unknown[]): Partial<Record<keyof RosterRow, number>> {
    const normalized = header.map(normalizeHeader);
    const mapping: Partial<Record<keyof RosterRow, number>> = {};

    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
        const index = normalized.findIndex((h) => h.length > 0 && aliases.includes(h));
        if (index !== -1) {
            mapping[field as keyof RosterRow] = index;
        }
    }
    return mapping;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseRoster(file: ArrayBuffer | Buffer | Uint8Array): ParsedRoster {
    let sheetRows: unknown[][];
    try {
        const workbook = readWorkbook(
            file instanceof Uint8Array ? file : new Uint8Array(file as ArrayBuffer)
        );
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!firstSheet) {
            return {rows: [], issues: [{rowNumber: 0, message: "Tệp không có sheet nào"}]};
        }
        // Keep blank rows: dropping them would shift every reported row number away
        // from the line the user actually sees in Excel. Empty rows are skipped below.
        sheetRows = XLSX.utils.sheet_to_json(firstSheet, {header: 1, blankrows: true, defval: ""});
    } catch {
        return {rows: [], issues: [{rowNumber: 0, message: "Không đọc được tệp — cần định dạng .xlsx, .xls hoặc .csv"}]};
    }

    if (sheetRows.length === 0) {
        return {rows: [], issues: [{rowNumber: 0, message: "Tệp rỗng"}]};
    }

    // Tolerate title/blank lines above the real header, as HR exports often have.
    const headerIndex = sheetRows.findIndex((row) => {
        const mapping = mapColumns(row);
        return mapping.name !== undefined && mapping.employeeCode !== undefined;
    });

    if (headerIndex === -1) {
        return {
            rows: [],
            issues: [{
                rowNumber: 0,
                message: "Không tìm thấy dòng tiêu đề có cả cột tên và mã nhân viên " +
                    "(ví dụ: \"Mã NV\", \"Họ tên\", \"Phòng ban\", \"Email\")",
            }],
        };
    }

    const columns = mapColumns(sheetRows[headerIndex]);
    const rows: RosterRow[] = [];
    const issues: RosterIssue[] = [];
    const seenCodes = new Map<string, number>();

    const body = sheetRows.slice(headerIndex + 1);
    if (body.length > MAX_ROWS) {
        issues.push({rowNumber: 0, message: `Tệp có hơn ${MAX_ROWS} dòng, hãy chia nhỏ`});
        return {rows: [], issues};
    }

    body.forEach((raw, offset) => {
        const rowNumber = headerIndex + offset + 2; // 1-based, and past the header
        const at = (field: keyof RosterRow) => {
            const index = columns[field];
            return index === undefined ? "" : cell(raw[index]);
        };

        const employeeCode = at("employeeCode");
        const name = at("name");
        const teamName = at("teamName");
        const email = at("email");

        // A wholly empty line is padding, not an error.
        if (!employeeCode && !name && !teamName && !email) return;

        if (!name) {
            issues.push({rowNumber, message: "Thiếu họ tên"});
            return;
        }
        if (!employeeCode) {
            issues.push({rowNumber, message: `Thiếu mã nhân viên (${name})`});
            return;
        }
        if (employeeCode.length > 50) {
            issues.push({rowNumber, message: `Mã nhân viên quá dài: "${employeeCode}"`});
            return;
        }
        if (name.length > 200) {
            issues.push({rowNumber, message: `Họ tên quá dài (${employeeCode})`});
            return;
        }
        if (!teamName) {
            issues.push({rowNumber, message: `Thiếu phòng ban (${employeeCode} — ${name})`});
            return;
        }
        if (email && !EMAIL_PATTERN.test(email)) {
            issues.push({rowNumber, message: `Email không hợp lệ: "${email}" (${employeeCode})`});
            return;
        }

        const duplicateOf = seenCodes.get(employeeCode.toLowerCase());
        if (duplicateOf !== undefined) {
            issues.push({
                rowNumber,
                message: `Mã nhân viên "${employeeCode}" trùng với dòng ${duplicateOf}`,
            });
            return;
        }
        seenCodes.set(employeeCode.toLowerCase(), rowNumber);

        rows.push({rowNumber, employeeCode, name, teamName, email: email || undefined});
    });

    return {rows, issues};
}

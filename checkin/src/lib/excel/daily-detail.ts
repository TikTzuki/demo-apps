import * as XLSX from "xlsx";
import type {AttendancePolicy, DayStatus} from "@/lib/attendance/compute";
import type {RangeRow} from "@/lib/attendance/queries";
import {formatDuration, localDateTimeLabel, localTimeLabel, workDateLabel} from "@/lib/attendance/time";
import {summarizeByMember, toHours} from "./summary";

const STATUS_LABELS: Record<DayStatus, string> = {
    ABSENT: "Vắng",
    PRESENT: "Có mặt",
    WORKING: "Đang làm",
    LATE: "Đi muộn",
    EARLY_LEAVE: "Về sớm",
    OT: "OT",
    MISSING_CHECKOUT: "Thiếu check-out",
    AUTO_CLOSED: "Tự đóng ca — chờ duyệt",
};

/** Not reported in the export: attendance is judged on hours, not on arrival time. */
const HIDDEN_STATUSES: readonly DayStatus[] = ["LATE", "EARLY_LEAVE"];

export function formatStatuses(statuses: readonly DayStatus[]): string {
    return statuses
        .filter((s) => !HIDDEN_STATUSES.includes(s))
        .map((s) => STATUS_LABELS[s])
        .join(", ");
}

const HEADERS = [
    "Ngày công",
    "Đội",
    "Mã NV",
    "Nhân viên",
    "Phiên",
    "Loại phiên",
    "Giờ vào",
    "Giờ ra",
    "Số phút phiên",
    "Giờ trước OT (phiên)",
    "Giờ OT (phiên)",
    "Tổng giờ làm (ngày)",
    "Giờ thường (ngày)",
    "Giờ OT (ngày)",
    "Trạng thái",
    "Ghi chú",
    "Sửa thủ công",
    "Tự đóng ca",
];

const COLUMN_WIDTHS = [12, 20, 10, 24, 8, 12, 18, 18, 14, 20, 16, 20, 18, 16, 26, 30, 14, 20];

const SUMMARY_HEADERS = [
    "Mã NV",
    "Nhân viên",
    "Đội",
    "Số ngày công",
    "Tổng giờ làm",
    "Giờ thường",
    "Giờ OT",
    "Thiếu check-out (ngày)",
    "Tự đóng ca (ngày)",
];

const SUMMARY_WIDTHS = [10, 24, 20, 14, 14, 13, 12, 22, 18];

/**
 * Per-person totals for the same range as the detail sheet.
 *
 * Hours are written as decimal NUMBERS (8.5, not "8h30") so payroll can sum a
 * column or multiply it by a rate. The detail sheet keeps the readable h:mm form.
 */
function buildSummarySheet(rows: readonly RangeRow[], range: { from: Date; to: Date }): XLSX.WorkSheet {
    const totals = summarizeByMember(rows);

    const body = totals.map((t) => [
        t.employeeCode ?? "",
        t.memberName,
        t.teamName,
        t.daysWorked,
        toHours(t.workedMinutes),
        toHours(t.regularMinutes),
        toHours(t.otMinutes),
        t.missingCheckoutDays,
        t.autoClosedDays,
    ]);

    const sum = (pick: (t: (typeof totals)[number]) => number) => totals.reduce((n, t) => n + pick(t), 0);

    const grandTotal = totals.length === 0 ? [] : [[
        "", `TỔNG (${totals.length} người)`, "",
        sum((t) => t.daysWorked),
        toHours(sum((t) => t.workedMinutes)),
        toHours(sum((t) => t.regularMinutes)),
        toHours(sum((t) => t.otMinutes)),
        sum((t) => t.missingCheckoutDays),
        sum((t) => t.autoClosedDays),
    ]];

    const sheetData = [
        [`Tổng công: ${workDateLabel(range.from)} — ${workDateLabel(range.to)}`],
        ["Đơn vị giờ: số thập phân (8.5 = 8 giờ 30 phút). Chi tiết từng phiên xem sheet \"Chi tiết chấm công\"."],
        [],
        SUMMARY_HEADERS,
        ...body,
        ...grandTotal,
    ];

    const sheet = XLSX.utils.aoa_to_sheet(sheetData);
    sheet["!cols"] = SUMMARY_WIDTHS.map((wch) => ({wch}));
    sheet["!freeze"] = {xSplit: "0", ySplit: "4"};
    return sheet;
}

/**
 * Raw-session export.
 *
 * One row per check-in/check-out pair, so both legs of an overnight shift appear
 * separately while sharing a business day — which is what makes a dispute
 * auditable. Day-level totals are written only on a member-day's first row so
 * that summing a column never double-counts.
 *
 * Per-session minutes are uncapped: "Giờ trước OT (phiên)" is the raw time that
 * session spent before the OT boundary, whereas "Giờ thường (ngày)" applies the
 * standard-shift cap. The day column is the one payroll should sum.
 */
export function buildDailyDetailWorkbook(
    rows: readonly RangeRow[],
    policy: AttendancePolicy,
    range: { from: Date; to: Date }
): Buffer {
    const dataRows = rows.flatMap((row) =>
        row.day.sessions.map((session, index) => {
            const isFirst = index === 0;
            return [
                workDateLabel(row.workDate),
                row.teamName,
                row.employeeCode ?? "",
                row.memberName,
                index + 1,
                session.kind === "OVERNIGHT" ? "Qua đêm" : "Ban ngày",
                localDateTimeLabel(session.checkInAt, policy),
                session.checkOutAt ? localDateTimeLabel(session.checkOutAt, policy) : "",
                session.durationMinutes,
                formatDuration(session.regularMinutes),
                formatDuration(session.otMinutes),
                isFirst ? formatDuration(row.day.workedMinutes) : "",
                isFirst ? formatDuration(row.day.regularMinutes) : "",
                isFirst ? formatDuration(row.day.otMinutes) : "",
                isFirst ? formatStatuses(row.day.statuses) : "",
                session.note ?? "",
                session.isManual ? "x" : "",
                session.autoClosedAt ? (session.reviewedAt ? "đã duyệt" : "chờ duyệt") : "",
            ];
        })
    );

    const sheetData = [
        [`Bảng chấm công chi tiết: ${workDateLabel(range.from)} — ${workDateLabel(range.to)}`],
        [
            `Ca chuẩn ${policy.shiftStartTime}–${policy.otStartTime} (${formatDuration(policy.standardShiftMinutes)})`,
            `OT tính từ ${policy.otStartTime}`,
            `Ca đêm từ ${policy.overnightStartTime}`,
            `Nghỉ trưa ${policy.breakMinutes} phút`,
            `Xuất lúc ${localDateTimeLabel(new Date(), policy)}`,
        ],
        [],
        HEADERS,
        ...dataRows,
    ];

    const sheet = XLSX.utils.aoa_to_sheet(sheetData);
    sheet["!cols"] = COLUMN_WIDTHS.map((wch) => ({wch}));
    sheet["!freeze"] = {xSplit: "0", ySplit: "4"};

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Chi tiết chấm công");
    XLSX.utils.book_append_sheet(workbook, buildSummarySheet(rows, range), "Tổng công");

    return XLSX.write(workbook, {type: "buffer", bookType: "xlsx"});
}

export function dailyDetailFilename(from: Date, to: Date): string {
    const key = (d: Date) => d.toISOString().slice(0, 10);
    return `cham-cong-${key(from)}-den-${key(to)}.xlsx`;
}

/** Local time label re-exported so the admin table and the sheet stay in sync. */
export {localTimeLabel};

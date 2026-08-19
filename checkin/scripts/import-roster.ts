/**
 * Bulk-load an employee roster from the command line.
 *
 * Same parser and upsert the admin UI uses — this exists for the initial load and
 * for running inside the cluster, where uploading through a browser is awkward.
 *
 *   npm run roster:preview -- ./nhan-vien.xlsx     # show the diff, write nothing
 *   npm run roster:import  -- ./nhan-vien.xlsx     # apply it
 */
import {promises as fs} from "node:fs";
import path from "node:path";
import {parseRoster} from "../src/lib/roster/parse";
import {importRoster} from "../src/lib/roster/import";
import {prisma} from "../src/lib/prisma";

async function main() {
    const args = process.argv.slice(2);
    const apply = args.includes("--apply");
    const file = args.find((a) => !a.startsWith("--"));

    if (!file) {
        console.error("Usage: tsx scripts/import-roster.ts <file.xlsx|.csv> [--apply]");
        process.exit(1);
    }

    const parsed = parseRoster(await fs.readFile(path.resolve(file)));

    for (const issue of parsed.issues) {
        console.warn(`  ! dòng ${issue.rowNumber || "-"}: ${issue.message}`);
    }
    if (parsed.rows.length === 0) {
        console.error("Không đọc được dòng hợp lệ nào.");
        process.exit(1);
    }

    const result = await importRoster(parsed.rows, parsed.issues, {dryRun: !apply});

    for (const change of result.changes) {
        if (change.action === "unchanged") continue;
        const detail = change.changes.length ? ` (${change.changes.join(", ")})` : "";
        console.log(`  ${change.action === "created" ? "+" : "~"} ${change.employeeCode} ${change.name}${detail}`);
    }
    if (result.teamsCreated.length > 0) {
        console.log(`\n  phòng ban mới: ${result.teamsCreated.join(", ")}`);
    }

    console.log(
        `\n${apply ? "Đã nhập" : "XEM TRƯỚC (chưa ghi gì)"}: ` +
        `${result.created} thêm mới, ${result.updated} cập nhật, ${result.unchanged} không đổi, ` +
        `${result.issues.length} dòng lỗi`
    );
    if (!apply) console.log("Chạy lại với --apply để ghi vào cơ sở dữ liệu.");
}

main()
    .catch((error) => {
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());

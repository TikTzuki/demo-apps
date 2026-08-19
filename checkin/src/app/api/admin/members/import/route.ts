import {NextResponse} from "next/server";
import {withAdmin} from "@/lib/auth/guard";
import {parseRoster} from "@/lib/roster/parse";
import {importRoster} from "@/lib/roster/import";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv"];

/**
 * Upload an HR roster export.
 *
 * `dryRun=true` returns exactly what would change without writing, so the admin
 * confirms the diff before a bad export reshuffles everyone's department.
 */
export const POST = withAdmin(async (_admin, request: Request) => {
    try {
        const form = await request.formData();
        const file = form.get("file");
        const dryRun = form.get("dryRun") === "true";

        if (!(file instanceof File)) {
            return NextResponse.json({success: false, error: "Chưa chọn tệp"}, {status: 400});
        }
        if (file.size === 0) {
            return NextResponse.json({success: false, error: "Tệp rỗng"}, {status: 400});
        }
        if (file.size > MAX_BYTES) {
            return NextResponse.json(
                {success: false, error: `Tệp quá lớn (tối đa ${MAX_BYTES / 1024 / 1024}MB)`},
                {status: 400}
            );
        }

        const name = file.name.toLowerCase();
        if (!ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
            return NextResponse.json(
                {success: false, error: "Chỉ chấp nhận tệp .xlsx, .xls hoặc .csv"},
                {status: 400}
            );
        }

        const parsed = parseRoster(Buffer.from(await file.arrayBuffer()));

        // Nothing usable: report the problems rather than silently doing nothing.
        if (parsed.rows.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: parsed.issues[0]?.message ?? "Không đọc được dòng nào từ tệp",
                    data: {issues: parsed.issues},
                },
                {status: 400}
            );
        }

        const result = await importRoster(parsed.rows, parsed.issues, {dryRun});

        return NextResponse.json({
            success: true,
            data: result,
            message: dryRun
                ? `Xem trước: ${result.created} thêm mới, ${result.updated} cập nhật, ${result.unchanged} không đổi`
                : `Đã nhập: ${result.created} thêm mới, ${result.updated} cập nhật, ${result.unchanged} không đổi`,
        });
    } catch (error) {
        console.error("Error importing roster:", error);
        return NextResponse.json({success: false, error: "Không thể nhập danh sách"}, {status: 500});
    }
});

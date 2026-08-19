import {NextResponse} from "next/server";
import {z} from "zod";
import {withAdmin} from "@/lib/auth/guard";
import {getPolicy} from "@/lib/attendance/settings";
import {currentWorkDate, getRange} from "@/lib/attendance/queries";
import {sweepThrottled} from "@/lib/attendance/sweep";
import {buildDailyDetailWorkbook, dailyDetailFilename} from "@/lib/excel/daily-detail";
import {parseWorkDateKey, workDateKey} from "@/lib/attendance/time";

export const dynamic = "force-dynamic";

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày phải theo định dạng YYYY-MM-DD");

export const GET = withAdmin(async (_admin, request: Request) => {
    try {
        const url = new URL(request.url);
        const policy = await getPolicy();
        const now = new Date();
        const today = workDateKey(currentWorkDate(policy, now));

        const parsed = z
            .object({from: dateKey.default(today), to: dateKey.default(today), teamId: z.string().uuid().optional()})
            .safeParse({
                from: url.searchParams.get("from") ?? undefined,
                to: url.searchParams.get("to") ?? undefined,
                teamId: url.searchParams.get("teamId") ?? undefined,
            });

        if (!parsed.success) {
            return NextResponse.json(
                {success: false, error: parsed.error.issues[0]?.message ?? "Tham số không hợp lệ"},
                {status: 400}
            );
        }

        const from = parseWorkDateKey(parsed.data.from);
        const to = parseWorkDateKey(parsed.data.to);
        if (from > to) {
            return NextResponse.json({success: false, error: "Ngày bắt đầu phải trước ngày kết thúc"}, {status: 400});
        }

        await sweepThrottled(policy, now);
        const rows = await getRange(from, to, policy, now, parsed.data.teamId);
        const buffer = buildDailyDetailWorkbook(rows, policy, {from, to});

        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="${dailyDetailFilename(from, to)}"`,
            },
        });
    } catch (error) {
        console.error("Error generating Excel:", error);
        return NextResponse.json({success: false, error: "Không thể xuất Excel"}, {status: 500});
    }
});

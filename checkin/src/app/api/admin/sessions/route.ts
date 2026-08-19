import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {withAdmin} from "@/lib/auth/guard";
import {getPolicy} from "@/lib/attendance/settings";
import {currentWorkDate, getRange} from "@/lib/attendance/queries";
import {serializeRangeRow} from "@/lib/attendance/serialize";
import {classifyKind} from "@/lib/attendance/compute";
import {parseWorkDateKey, workDateKey, workDateOf} from "@/lib/attendance/time";

export const dynamic = "force-dynamic";

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày phải theo định dạng YYYY-MM-DD");

const createSchema = z.object({
    memberId: z.string().uuid("Nhân viên không hợp lệ"),
    checkInAt: z.string().datetime({offset: true}),
    checkOutAt: z.string().datetime({offset: true}).nullable().optional(),
    note: z.string().max(500, "Ghi chú tối đa 500 ký tự").min(1, "Vui lòng ghi lý do sửa"),
});

/** Attendance for a date range — the admin table and export share this query. */
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

        const rows = await getRange(from, to, policy, now, parsed.data.teamId);

        return NextResponse.json({
            success: true,
            data: {
                from: parsed.data.from,
                to: parsed.data.to,
                policy,
                rows: rows.map(serializeRangeRow),
            },
        });
    } catch (error) {
        console.error("Error loading attendance range:", error);
        return NextResponse.json({success: false, error: "Không thể tải dữ liệu chấm công"}, {status: 500});
    }
});

/** Add a session by hand — for someone who forgot to check in at all. */
export const POST = withAdmin(async (_admin, request: Request) => {
    try {
        const parsed = createSchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json(
                {success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ"},
                {status: 400}
            );
        }

        const policy = await getPolicy();
        const checkInAt = new Date(parsed.data.checkInAt);
        const checkOutAt = parsed.data.checkOutAt ? new Date(parsed.data.checkOutAt) : null;

        if (checkOutAt && checkOutAt <= checkInAt) {
            return NextResponse.json({success: false, error: "Giờ ra phải sau giờ vào"}, {status: 400});
        }

        const session = await prisma.attendanceSession.create({
            data: {
                memberId: parsed.data.memberId,
                workDate: workDateOf(checkInAt, policy),
                checkInAt,
                checkOutAt,
                kind: classifyKind(checkInAt, policy),
                note: parsed.data.note,
                isManual: true,
            },
        });

        return NextResponse.json({success: true, data: session, message: "Đã thêm phiên chấm công"});
    } catch (error) {
        console.error("Error creating session:", error);
        return NextResponse.json({success: false, error: "Không thể thêm phiên chấm công"}, {status: 500});
    }
});

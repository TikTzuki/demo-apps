import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {withAdmin} from "@/lib/auth/guard";
import {getPolicy} from "@/lib/attendance/settings";
import {classifyKind} from "@/lib/attendance/compute";
import {workDateOf} from "@/lib/attendance/time";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

const updateSchema = z.object({
    checkInAt: z.string().datetime({offset: true}).optional(),
    checkOutAt: z.string().datetime({offset: true}).nullable().optional(),
    note: z.string().max(500).min(1, "Vui lòng ghi lý do sửa"),
});

export const PATCH = withAdmin(async (_admin, request: Request, context: Context) => {
    try {
        const {id} = await context.params;
        const parsed = updateSchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json(
                {success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ"},
                {status: 400}
            );
        }

        const existing = await prisma.attendanceSession.findUnique({where: {id}});
        if (!existing) {
            return NextResponse.json({success: false, error: "Phiên chấm công không tồn tại"}, {status: 404});
        }

        const policy = await getPolicy();
        const checkInAt = parsed.data.checkInAt ? new Date(parsed.data.checkInAt) : existing.checkInAt;
        const checkOutAt =
            parsed.data.checkOutAt === undefined
                ? existing.checkOutAt
                : parsed.data.checkOutAt === null
                    ? null
                    : new Date(parsed.data.checkOutAt);

        if (checkOutAt && checkOutAt <= checkInAt) {
            return NextResponse.json({success: false, error: "Giờ ra phải sau giờ vào"}, {status: 400});
        }

        // Re-derive the business day and shift kind: moving a check-in past
        // 21:00 turns a day shift into a night shift.
        const session = await prisma.attendanceSession.update({
            where: {id},
            data: {
                checkInAt,
                checkOutAt,
                workDate: workDateOf(checkInAt, policy),
                kind: classifyKind(checkInAt, policy),
                note: parsed.data.note,
                isManual: true,
            },
        });

        return NextResponse.json({success: true, data: session, message: "Đã cập nhật phiên chấm công"});
    } catch (error) {
        console.error("Error updating session:", error);
        return NextResponse.json({success: false, error: "Không thể cập nhật phiên chấm công"}, {status: 500});
    }
});

export const DELETE = withAdmin(async (_admin, _request: Request, context: Context) => {
    try {
        const {id} = await context.params;
        await prisma.attendanceSession.delete({where: {id}});
        return NextResponse.json({success: true, message: "Đã xoá phiên chấm công"});
    } catch (error) {
        console.error("Error deleting session:", error);
        return NextResponse.json({success: false, error: "Không thể xoá phiên chấm công"}, {status: 500});
    }
});

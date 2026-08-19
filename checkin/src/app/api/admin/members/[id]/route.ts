import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {withAdmin} from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

const updateSchema = z.object({
    name: z.string().min(1).max(200).transform((s) => s.trim()).optional(),
    teamId: z.string().uuid().optional(),
    email: z.string().email("Email không hợp lệ").max(200).optional().or(z.literal("")),
    employeeCode: z.string().max(50).optional().or(z.literal("")),
    isActive: z.boolean().optional(),
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

        const {email, employeeCode, ...rest} = parsed.data;
        const member = await prisma.member.update({
            where: {id},
            data: {
                ...rest,
                ...(email !== undefined ? {email: email || null} : {}),
                ...(employeeCode !== undefined ? {employeeCode: employeeCode || null} : {}),
            },
        });

        return NextResponse.json({success: true, data: member, message: "Đã cập nhật nhân viên"});
    } catch (error) {
        if (error instanceof Error && error.message.includes("employee_code")) {
            return NextResponse.json({success: false, error: "Mã nhân viên đã tồn tại"}, {status: 400});
        }
        console.error("Error updating member:", error);
        return NextResponse.json({success: false, error: "Không thể cập nhật nhân viên"}, {status: 500});
    }
});

export const DELETE = withAdmin(async (_admin, _request: Request, context: Context) => {
    try {
        const {id} = await context.params;
        const sessions = await prisma.attendanceSession.count({where: {memberId: id}});

        // Deleting cascades to attendance history. Once someone has a timesheet
        // we deactivate instead, so past payroll stays intact.
        if (sessions > 0) {
            const member = await prisma.member.update({where: {id}, data: {isActive: false}});
            return NextResponse.json({
                success: true,
                data: member,
                message: `Nhân viên có ${sessions} phiên chấm công nên đã được vô hiệu hoá thay vì xoá`,
            });
        }

        await prisma.member.delete({where: {id}});
        return NextResponse.json({success: true, message: "Đã xoá nhân viên"});
    } catch (error) {
        console.error("Error deleting member:", error);
        return NextResponse.json({success: false, error: "Không thể xoá nhân viên"}, {status: 500});
    }
});

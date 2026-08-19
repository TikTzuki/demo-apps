import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {withAdmin} from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

const updateSchema = z.object({
    name: z.string().min(1).max(200).transform((s) => s.trim()).optional(),
    color: z.string().max(50).optional(),
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

        const team = await prisma.team.update({where: {id}, data: parsed.data});
        return NextResponse.json({success: true, data: team, message: "Đã cập nhật đội"});
    } catch (error) {
        console.error("Error updating team:", error);
        return NextResponse.json({success: false, error: "Không thể cập nhật đội"}, {status: 500});
    }
});

export const DELETE = withAdmin(async (_admin, _request: Request, context: Context) => {
    try {
        const {id} = await context.params;

        // Deleting a team cascades to its members and their attendance history,
        // so refuse while anyone is still assigned to it.
        const members = await prisma.member.count({where: {teamId: id}});
        if (members > 0) {
            return NextResponse.json(
                {success: false, error: `Đội còn ${members} nhân viên, hãy chuyển họ sang đội khác trước`},
                {status: 400}
            );
        }

        await prisma.team.delete({where: {id}});
        return NextResponse.json({success: true, message: "Đã xoá đội"});
    } catch (error) {
        console.error("Error deleting team:", error);
        return NextResponse.json({success: false, error: "Không thể xoá đội"}, {status: 500});
    }
});

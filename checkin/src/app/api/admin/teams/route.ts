import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {withAdmin} from "@/lib/auth/guard";
import {getTeamColor} from "@/lib/utils";

export const dynamic = "force-dynamic";

const createSchema = z.object({
    name: z.string().min(1, "Tên đội không được để trống").max(200).transform((s) => s.trim()),
    color: z.string().max(50).optional(),
});

export const GET = withAdmin(async () => {
    try {
        const teams = await prisma.team.findMany({
            include: {members: {orderBy: {createdAt: "asc"}}},
            orderBy: {createdAt: "asc"},
        });

        return NextResponse.json({
            success: true,
            data: teams.map((team) => ({
                id: team.id,
                name: team.name,
                color: team.color,
                members: team.members.map((m) => ({
                    id: m.id,
                    name: m.name,
                    email: m.email ?? undefined,
                    employeeCode: m.employeeCode ?? undefined,
                    isActive: m.isActive,
                    teamId: m.teamId,
                })),
            })),
        });
    } catch (error) {
        console.error("Error listing teams:", error);
        return NextResponse.json({success: false, error: "Không thể lấy danh sách đội"}, {status: 500});
    }
});

export const POST = withAdmin(async (_admin, request: Request) => {
    try {
        const parsed = createSchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json(
                {success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ"},
                {status: 400}
            );
        }

        const count = await prisma.team.count();
        const team = await prisma.team.create({
            data: {name: parsed.data.name, color: parsed.data.color || getTeamColor(count)},
        });

        return NextResponse.json({success: true, data: team, message: "Đã tạo đội"});
    } catch (error) {
        console.error("Error creating team:", error);
        return NextResponse.json({success: false, error: "Không thể tạo đội"}, {status: 500});
    }
});

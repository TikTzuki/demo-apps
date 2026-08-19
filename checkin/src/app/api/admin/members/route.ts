import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {withAdmin} from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

const createSchema = z.object({
    name: z.string().min(1, "Tên không được để trống").max(200).transform((s) => s.trim()),
    teamId: z.string().uuid("Đội không hợp lệ"),
    email: z.string().email("Email không hợp lệ").max(200).optional().or(z.literal("")),
    employeeCode: z.string().max(50).optional().or(z.literal("")),
});

export const GET = withAdmin(async () => {
    try {
        const members = await prisma.member.findMany({
            include: {team: true},
            orderBy: [{team: {createdAt: "asc"}}, {createdAt: "asc"}],
        });

        return NextResponse.json({
            success: true,
            data: members.map((m) => ({
                id: m.id,
                name: m.name,
                email: m.email ?? undefined,
                employeeCode: m.employeeCode ?? undefined,
                isActive: m.isActive,
                teamId: m.teamId,
                teamName: m.team.name,
                teamColor: m.team.color,
            })),
        });
    } catch (error) {
        console.error("Error listing members:", error);
        return NextResponse.json({success: false, error: "Không thể lấy danh sách nhân viên"}, {status: 500});
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

        const {name, teamId, email, employeeCode} = parsed.data;
        const member = await prisma.member.create({
            data: {
                name,
                teamId,
                email: email || null,
                employeeCode: employeeCode || null,
            },
        });

        return NextResponse.json({success: true, data: member, message: "Đã thêm nhân viên"});
    } catch (error) {
        if (error instanceof Error && error.message.includes("employee_code")) {
            return NextResponse.json({success: false, error: "Mã nhân viên đã tồn tại"}, {status: 400});
        }
        console.error("Error creating member:", error);
        return NextResponse.json({success: false, error: "Không thể thêm nhân viên"}, {status: 500});
    }
});

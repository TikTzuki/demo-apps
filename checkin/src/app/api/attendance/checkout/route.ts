import {NextResponse} from "next/server";
import {z} from "zod";
import {checkOut} from "@/lib/attendance/actions";
import {getPolicy} from "@/lib/attendance/settings";

export const dynamic = "force-dynamic";

const schema = z.object({memberId: z.string().uuid("Mã nhân viên không hợp lệ")});

export async function POST(request: Request) {
    try {
        const parsed = schema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json(
                {success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ"},
                {status: 400}
            );
        }

        const policy = await getPolicy();
        const result = await checkOut(parsed.data.memberId, policy, new Date());

        if (!result.success) {
            return NextResponse.json({success: false, error: result.error}, {status: 400});
        }

        return NextResponse.json({
            success: true,
            data: result.data,
            message: "Check-out thành công!",
        });
    } catch (error) {
        console.error("Error checking out:", error);
        return NextResponse.json({success: false, error: "Không thể check-out"}, {status: 500});
    }
}

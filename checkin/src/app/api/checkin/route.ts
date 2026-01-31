import {NextResponse} from "next/server";
import {checkinMember} from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {teamId, memberId} = body;

        if (!teamId || !memberId) {
            return NextResponse.json(
                {success: false, error: "Thiếu thông tin teamId hoặc memberId"},
                {status: 400}
            );
        }

        const result = await checkinMember(teamId, memberId);

        if (!result.success) {
            return NextResponse.json(
                {success: false, error: result.error},
                {status: 400}
            );
        }

        return NextResponse.json({
            success: true,
            data: result.member,
            message: "Check-in thành công!",
        });
    } catch (error) {
        console.error("Error checking in:", error);
        return NextResponse.json(
            {success: false, error: "Không thể check-in"},
            {status: 500}
        );
    }
}

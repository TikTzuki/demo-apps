import {NextResponse} from "next/server";
import {uncheckinMember} from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(
    request: Request,
    {params}: { params: { memberId: string } }
) {
    try {
        const result = await uncheckinMember(params.memberId);

        if (!result.success) {
            return NextResponse.json(
                {success: false, error: result.error},
                {status: 400}
            );
        }

        return NextResponse.json({
            success: true,
            data: result.member,
            message: "Đã hủy check-in",
        });
    } catch (error) {
        console.error("Error unchecking in:", error);
        return NextResponse.json(
            {success: false, error: "Không thể hủy check-in"},
            {status: 500}
        );
    }
}

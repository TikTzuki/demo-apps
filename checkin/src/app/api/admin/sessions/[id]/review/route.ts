import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {withAdmin} from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

/**
 * Accept an auto-closed session as-is.
 *
 * Separate from PATCH because nothing changes about the times — the admin is
 * confirming the system's guess was right, which needs no reason and must not
 * mark the row as hand-edited.
 */
export const POST = withAdmin(async (_admin, _request: Request, context: Context) => {
    try {
        const {id} = await context.params;

        const result = await prisma.attendanceSession.updateMany({
            where: {id, autoClosedAt: {not: null}, reviewedAt: null},
            data: {reviewedAt: new Date()},
        });

        if (result.count === 0) {
            return NextResponse.json(
                {success: false, error: "Phiên này không chờ duyệt"},
                {status: 400}
            );
        }

        return NextResponse.json({success: true, message: "Đã duyệt phiên tự đóng"});
    } catch (error) {
        console.error("Error reviewing session:", error);
        return NextResponse.json({success: false, error: "Không thể duyệt phiên"}, {status: 500});
    }
});

import {NextResponse} from "next/server";
import {getBoard} from "@/lib/attendance/board";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        return NextResponse.json({success: true, data: await getBoard()});
    } catch (error) {
        console.error("Error loading attendance board:", error);
        return NextResponse.json(
            {success: false, error: "Không thể tải bảng chấm công"},
            {status: 500}
        );
    }
}

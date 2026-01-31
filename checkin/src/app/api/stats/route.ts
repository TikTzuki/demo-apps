import {NextResponse} from "next/server";
import {getStats} from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const stats = await getStats();
        return NextResponse.json({success: true, data: stats});
    } catch (error) {
        console.error("Error fetching stats:", error);
        return NextResponse.json(
            {success: false, error: "Không thể lấy thống kê"},
            {status: 500}
        );
    }
}

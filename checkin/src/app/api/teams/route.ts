import {NextResponse} from "next/server";
import {getTeams} from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const teams = await getTeams();
        return NextResponse.json({success: true, data: teams});
    } catch (error) {
        console.error("Error fetching teams:", error);
        return NextResponse.json(
            {success: false, error: "Không thể lấy danh sách đội"},
            {status: 500}
        );
    }
}

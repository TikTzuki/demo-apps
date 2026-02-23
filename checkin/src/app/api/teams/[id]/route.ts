import {NextResponse} from "next/server";
import {getTeamById} from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    {params}: { params: Promise<{ id: string }> }
) {
    try {
        const {id} = await params;
        const team = await getTeamById(id);

        if (!team) {
            return NextResponse.json(
                {success: false, error: "Team không tồn tại"},
                {status: 404}
            );
        }

        return NextResponse.json({success: true, data: team});
    } catch (error) {
        console.error("Error fetching team:", error);
        return NextResponse.json(
            {success: false, error: "Không thể lấy thông tin đội"},
            {status: 500}
        );
    }
}

import {NextResponse} from "next/server";
import {getLixiSession, getOrCreateLixiSession, resetLixiSession} from "@/lib/lixi-db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getLixiSession();
        return NextResponse.json({success: true, data: session});
    } catch (error) {
        console.error("Error fetching lixi session:", error);
        return NextResponse.json(
            {success: false, error: "Không thể lấy phiên lì xì"},
            {status: 500}
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {total, amounts, reset} = body as { total: number; amounts: number[]; reset?: boolean };

        if (!total || !amounts || !Array.isArray(amounts)) {
            return NextResponse.json(
                {success: false, error: "Missing total or amounts"},
                {status: 400}
            );
        }

        const session = reset
            ? await resetLixiSession(total, amounts)
            : await getOrCreateLixiSession(total, amounts);
        return NextResponse.json({success: true, data: session});
    } catch (error) {
        console.error("Error creating lixi session:", error);
        return NextResponse.json(
            {success: false, error: "Không thể tạo phiên lì xì"},
            {status: 500}
        );
    }
}

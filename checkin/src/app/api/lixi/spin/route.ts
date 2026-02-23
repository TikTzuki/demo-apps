import {NextResponse} from "next/server";
import {recordLixiSpin} from "@/lib/lixi-db";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {playerName, amount, spinOrder} = body as {
            playerName: string;
            amount: number;
            spinOrder: number;
        };

        if (!playerName || amount == null || spinOrder == null) {
            return NextResponse.json(
                {success: false, error: "Missing required fields"},
                {status: 400}
            );
        }

        const spin = await recordLixiSpin(playerName, amount, spinOrder);
        return NextResponse.json({success: true, data: spin});
    } catch (error) {
        console.error("Error recording lixi spin:", error);
        return NextResponse.json(
            {success: false, error: "Không thể lưu kết quả quay"},
            {status: 500}
        );
    }
}

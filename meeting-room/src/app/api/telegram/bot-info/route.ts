import {NextResponse} from "next/server";

export async function GET() {
    const username = process.env.TELEGRAM_BOT_USERNAME ?? "";
    return NextResponse.json({username});
}

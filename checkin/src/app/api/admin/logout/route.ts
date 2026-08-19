import {NextResponse} from "next/server";
import {AUTH_COOKIE} from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST() {
    const response = NextResponse.json({success: true, message: "Đã đăng xuất"});
    response.cookies.delete(AUTH_COOKIE);
    return response;
}

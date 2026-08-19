import {NextResponse, type NextRequest} from "next/server";
import {AUTH_COOKIE, readSessionToken} from "@/lib/auth/session";

/** Gate every admin page and API route behind a valid session cookie. */
export default async function proxy(request: NextRequest) {
    const {pathname} = request.nextUrl;

    if (pathname === "/admin/login" || pathname === "/api/admin/login") {
        return NextResponse.next();
    }

    const admin = await readSessionToken(request.cookies.get(AUTH_COOKIE)?.value);
    if (admin) return NextResponse.next();

    if (pathname.startsWith("/api/")) {
        return NextResponse.json({success: false, error: "Chưa đăng nhập"}, {status: 401});
    }

    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
}

export const config = {
    matcher: ["/admin/:path*", "/api/admin/:path*"],
};

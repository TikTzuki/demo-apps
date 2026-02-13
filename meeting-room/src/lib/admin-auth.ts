import {NextRequest, NextResponse} from "next/server";
import {timingSafeEqual} from "crypto";

function constantTimeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
        // Compare against self to keep constant time, then return false
        timingSafeEqual(bufA, bufA);
        return false;
    }
    return timingSafeEqual(bufA, bufB);
}

export function requireAdmin(request: NextRequest): NextResponse | null {
    const secret = request.headers.get("X-Admin-Secret");
    const expected = process.env.ADMIN_SECRET;

    if (!expected) {
        return NextResponse.json(
            {success: false, error: "Admin not configured"},
            {status: 500}
        );
    }

    if (!secret || !constantTimeEqual(secret, expected)) {
        return NextResponse.json(
            {success: false, error: "Unauthorized"},
            {status: 401}
        );
    }

    return null;
}

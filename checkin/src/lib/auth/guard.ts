import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {AUTH_COOKIE, type AdminClaims, readSessionToken} from "./session";

/**
 * Resolve the signed-in admin for a route handler.
 *
 * `middleware.ts` already blocks unauthenticated requests, but route handlers
 * re-check so a mistake in the matcher cannot expose data.
 */
export async function getAdmin(): Promise<AdminClaims | null> {
    const store = await cookies();
    return readSessionToken(store.get(AUTH_COOKIE)?.value);
}

export const UNAUTHORIZED = NextResponse.json(
    {success: false, error: "Chưa đăng nhập"},
    {status: 401}
);

/**
 * Run `handler` only for a signed-in admin.
 *
 * Usage: `export const GET = withAdmin(async () => { ... })`
 */
export function withAdmin<Args extends unknown[]>(
    handler: (admin: AdminClaims, ...args: Args) => Promise<NextResponse>
) {
    return async (...args: Args): Promise<NextResponse> => {
        const admin = await getAdmin();
        if (!admin) return UNAUTHORIZED;
        return handler(admin, ...args);
    };
}

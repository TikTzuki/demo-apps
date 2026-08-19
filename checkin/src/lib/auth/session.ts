import {jwtVerify, SignJWT} from "jose";
import type {AdminUserInfo} from "@/lib/types";

export const AUTH_COOKIE = "checkin_admin";
const ISSUER = "checkin-attendance";
const MAX_AGE_SECONDS = 60 * 60 * 8;

/**
 * Signing key.
 *
 * Throws rather than falling back to a constant: an unsigned-in-practice cookie
 * would silently hand anyone admin access (.claude/rules/security.md).
 */
function getSecret(): Uint8Array {
    const secret = process.env.AUTH_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error("AUTH_SECRET chưa được cấu hình (cần tối thiểu 32 ký tự)");
    }
    return new TextEncoder().encode(secret);
}

export interface AdminClaims extends AdminUserInfo {
    exp?: number;
}

export async function createSessionToken(user: AdminUserInfo): Promise<string> {
    return new SignJWT({email: user.email, name: user.name, role: user.role})
        .setProtectedHeader({alg: "HS256"})
        .setSubject(user.id)
        .setIssuer(ISSUER)
        .setIssuedAt()
        .setExpirationTime(`${MAX_AGE_SECONDS}s`)
        .sign(getSecret());
}

export async function readSessionToken(token: string | undefined): Promise<AdminClaims | null> {
    if (!token) return null;
    try {
        const {payload} = await jwtVerify(token, getSecret(), {issuer: ISSUER});
        if (!payload.sub) return null;
        return {
            id: payload.sub,
            email: String(payload.email ?? ""),
            name: String(payload.name ?? ""),
            role: String(payload.role ?? "ADMIN"),
            exp: payload.exp,
        };
    } catch {
        // Expired, tampered with, or signed by a rotated key — all mean "not logged in".
        return null;
    }
}

export const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
} as const;

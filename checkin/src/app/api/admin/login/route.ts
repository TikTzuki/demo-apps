import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {verifyPassword} from "@/lib/auth/password";
import {AUTH_COOKIE, COOKIE_OPTIONS, createSessionToken} from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const schema = z.object({
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export async function POST(request: Request) {
    try {
        const parsed = schema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json(
                {success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ"},
                {status: 400}
            );
        }

        const {email, password} = parsed.data;
        const user = await prisma.adminUser.findUnique({where: {email: email.toLowerCase()}});

        // Same message and roughly the same work either way, so the response
        // does not reveal which accounts exist.
        const ok = user !== null && user.isActive && (await verifyPassword(password, user.passwordHash));
        if (!user || !ok) {
            return NextResponse.json(
                {success: false, error: "Email hoặc mật khẩu không đúng"},
                {status: 401}
            );
        }

        const info = {id: user.id, email: user.email, name: user.name, role: user.role};
        const token = await createSessionToken(info);

        const response = NextResponse.json({success: true, data: info, message: "Đăng nhập thành công"});
        response.cookies.set(AUTH_COOKIE, token, COOKIE_OPTIONS);
        return response;
    } catch (error) {
        console.error("Error logging in:", error);
        return NextResponse.json({success: false, error: "Không thể đăng nhập"}, {status: 500});
    }
}

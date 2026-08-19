import {NextResponse} from "next/server";
import {withAdmin} from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export const GET = withAdmin(async (admin) =>
    NextResponse.json({
        success: true,
        data: {id: admin.id, email: admin.email, name: admin.name, role: admin.role},
    })
);

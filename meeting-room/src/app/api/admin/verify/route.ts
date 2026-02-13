import {NextRequest, NextResponse} from "next/server";
import {requireAdmin} from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
    const error = requireAdmin(request);
    if (error) return error;

    return NextResponse.json({success: true});
}

import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {requireAdmin} from "@/lib/admin-auth";

export async function DELETE(
    request: NextRequest,
    {params}: { params: Promise<{ id: string }> }
) {
    const authError = requireAdmin(request);
    if (authError) return authError;

    try {
        const {id} = await params;

        await prisma.meetingRoom.delete({where: {id}});

        return NextResponse.json({success: true});
    } catch (e) {
        return NextResponse.json(
            {success: false, error: "Failed to delete room"},
            {status: 500}
        );
    }
}

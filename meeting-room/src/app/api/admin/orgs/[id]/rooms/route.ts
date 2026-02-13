import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {requireAdmin} from "@/lib/admin-auth";
import {createRoomSchema} from "@/lib/validations";

export async function POST(
    request: NextRequest,
    {params}: { params: Promise<{ id: string }> }
) {
    const authError = requireAdmin(request);
    if (authError) return authError;

    try {
        const {id: orgId} = await params;
        const body = await request.json();
        const parsed = createRoomSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {success: false, error: parsed.error.errors[0].message},
                {status: 400}
            );
        }

        // Verify org exists
        const org = await prisma.organization.findUnique({where: {id: orgId}});
        if (!org) {
            return NextResponse.json(
                {success: false, error: "Organization not found"},
                {status: 404}
            );
        }

        const room = await prisma.meetingRoom.create({
            data: {...parsed.data, organizationId: orgId},
        });

        return NextResponse.json(
            {
                success: true,
                data: {
                    id: room.id,
                    name: room.name,
                    capacity: room.capacity,
                    location: room.location,
                },
            },
            {status: 201}
        );
    } catch (e) {
        return NextResponse.json(
            {success: false, error: "Failed to create room"},
            {status: 500}
        );
    }
}

import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import type {OrgListItem} from "@/lib/types";

export async function GET() {
    try {
        const orgs = await prisma.organization.findMany({
            include: {_count: {select: {rooms: true}}},
            orderBy: {createdAt: "desc"},
        });

        const data: OrgListItem[] = orgs.map((org) => ({
            id: org.id,
            name: org.name,
            tag: org.tag,
            description: org.description,
            roomCount: org._count.rooms,
        }));

        return NextResponse.json({success: true, data});
    } catch (e) {
        return NextResponse.json(
            {success: false, error: "Failed to fetch organizations"},
            {status: 500}
        );
    }
}

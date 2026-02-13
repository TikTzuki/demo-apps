import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import type {RoomListItem} from "@/lib/types";

export async function GET(
    _request: NextRequest,
    {params}: { params: Promise<{ id: string }> }
) {
    try {
        const {id} = await params;
        const now = new Date();

        const rooms = await prisma.meetingRoom.findMany({
            where: {organizationId: id},
            include: {
                bookings: {
                    where: {
                        startTime: {lte: now},
                        endTime: {gt: now},
                    },
                    take: 1,
                },
            },
            orderBy: {name: "asc"},
        });

        const data: RoomListItem[] = rooms.map((room) => {
            const currentBooking = room.bookings[0] ?? null;
            return {
                id: room.id,
                name: room.name,
                capacity: room.capacity,
                location: room.location,
                status: currentBooking ? "occupied" : "available",
                currentBooking: currentBooking
                    ? {
                        bookerName: currentBooking.bookerName,
                        endTime: currentBooking.endTime.toISOString(),
                    }
                    : null,
            };
        });

        return NextResponse.json({success: true, data});
    } catch (e) {
        return NextResponse.json(
            {success: false, error: "Failed to fetch rooms"},
            {status: 500}
        );
    }
}

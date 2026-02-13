import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import type {BookingSlot} from "@/lib/types";

export async function GET(
    request: NextRequest,
    {params}: { params: Promise<{ id: string }> }
) {
    try {
        const {id} = await params;
        const dateParam = request.nextUrl.searchParams.get("date");

        // Default to today
        const date = dateParam ? new Date(dateParam) : new Date();
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const bookings = await prisma.booking.findMany({
            where: {
                roomId: id,
                startTime: {lte: dayEnd},
                endTime: {gte: dayStart},
            },
            orderBy: {startTime: "asc"},
        });

        const data: BookingSlot[] = bookings.map((b) => ({
            id: b.id,
            bookerName: b.bookerName,
            startTime: b.startTime.toISOString(),
            endTime: b.endTime.toISOString(),
            durationMinutes: Math.round(
                (b.endTime.getTime() - b.startTime.getTime()) / 60000
            ),
        }));

        return NextResponse.json({success: true, data});
    } catch (e) {
        return NextResponse.json(
            {success: false, error: "Failed to fetch bookings"},
            {status: 500}
        );
    }
}

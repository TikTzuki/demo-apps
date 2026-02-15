import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {createBookingSchema} from "@/lib/validations";
import {notifyBookingCreated} from "@/lib/telegram";
import {notifyBookingCreated as notifyBookingCreatedDiscord} from "@/lib/discord";
import type {BookingConfirmation} from "@/lib/types";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = createBookingSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {success: false, error: parsed.error.errors[0].message},
                {status: 400}
            );
        }

        const {roomId, bookerName, startTime, durationMinutes} = parsed.data;
        const start = new Date(startTime);
        const end = new Date(start.getTime() + durationMinutes * 60000);

        // Verify room exists and get room + org info
        const room = await prisma.meetingRoom.findUnique({
            where: {id: roomId},
            include: {organization: true},
        });

        if (!room) {
            return NextResponse.json(
                {success: false, error: "Room not found"},
                {status: 404}
            );
        }

        // Check for time conflicts
        const conflict = await prisma.booking.findFirst({
            where: {
                roomId,
                startTime: {lt: end},
                endTime: {gt: start},
            },
        });

        if (conflict) {
            return NextResponse.json(
                {success: false, error: "Time slot conflicts with an existing booking"},
                {status: 409}
            );
        }

        // Create booking
        const booking = await prisma.booking.create({
            data: {
                bookerName,
                startTime: start,
                endTime: end,
                roomId,
            },
        });

        const data: BookingConfirmation = {
            id: booking.id,
            roomName: room.name,
            orgName: room.organization.name,
            bookerName: booking.bookerName,
            startTime: booking.startTime.toISOString(),
            endTime: booking.endTime.toISOString(),
            durationMinutes,
        };

        const notificationData = {
            roomId: room.id,
            roomName: room.name,
            orgName: room.organization.name,
            orgTag: room.organization.tag,
            bookerName: booking.bookerName,
            startTime: booking.startTime,
            endTime: booking.endTime,
        };

        notifyBookingCreated(room.organization.id, notificationData);
        notifyBookingCreatedDiscord(room.organization.id, notificationData);

        return NextResponse.json({success: true, data}, {status: 201});
    } catch (e) {
        return NextResponse.json(
            {success: false, error: "Failed to create booking"},
            {status: 500}
        );
    }
}

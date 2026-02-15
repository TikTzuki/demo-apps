import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {notifyBookingCancelled} from "@/lib/telegram";
import {notifyBookingCancelled as notifyBookingCancelledDiscord} from "@/lib/discord";
import {z} from "zod";

const cancelBookingSchema = z.object({
    bookerName: z.string().min(1, "Name is required").trim(),
});

export async function DELETE(
    request: NextRequest,
    {params}: { params: Promise<{ id: string }> }
) {
    try {
        const {id} = await params;
        const body = await request.json();
        const parsed = cancelBookingSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {success: false, error: parsed.error.errors[0].message},
                {status: 400}
            );
        }

        const booking = await prisma.booking.findUnique({
            where: {id},
            include: {room: {include: {organization: true}}},
        });

        if (!booking) {
            return NextResponse.json(
                {success: false, error: "Booking not found"},
                {status: 404}
            );
        }

        // Verify booker name matches (case-insensitive)
        if (booking.bookerName.toLowerCase() !== parsed.data.bookerName.toLowerCase()) {
            return NextResponse.json(
                {success: false, error: "Name does not match the booking"},
                {status: 403}
            );
        }

        await prisma.booking.delete({where: {id}});

        const notificationData = {
            roomId: booking.room.id,
            roomName: booking.room.name,
            orgName: booking.room.organization.name,
            orgTag: booking.room.organization.tag,
            bookerName: booking.bookerName,
            startTime: booking.startTime,
            endTime: booking.endTime,
        };

        notifyBookingCancelled(booking.room.organization.id, notificationData);
        notifyBookingCancelledDiscord(booking.room.organization.id, notificationData);

        return NextResponse.json({success: true});
    } catch {
        return NextResponse.json(
            {success: false, error: "Failed to cancel booking"},
            {status: 500}
        );
    }
}

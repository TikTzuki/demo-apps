import {REST} from "@discordjs/rest";
import {Routes} from "discord-api-types/v10";
import {prisma} from "@/lib/prisma";

function getRestClient(): REST | undefined {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) return undefined;
    return new REST({version: "10"}).setToken(token);
}

export async function sendDiscordMessage(
    channelId: string,
    message: string
): Promise<void> {
    const rest = getRestClient();
    if (!rest) return;

    try {
        await rest.post(Routes.channelMessages(channelId), {
            body: {content: message},
        });
    } catch (err) {
        console.error("Failed to send Discord notification:", err);
    }
}

interface BookingNotificationData {
    roomId: string;
    roomName: string;
    orgName: string;
    orgTag: string;
    bookerName: string;
    startTime: Date;
    endTime: Date;
}

function formatTime(date: Date): string {
    return date.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

function formatDate(date: Date): string {
    return date.toLocaleString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function buildRoomUrl(roomId: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return `${baseUrl}/rooms/${roomId}`;
}

export function buildBookingCreatedMessage(data: BookingNotificationData): string {
    return [
        `📅 [**Đặt phòng mới** #${data.orgTag}](${buildRoomUrl(data.roomId)})`,
        "",
        `**Phòng:** ${data.roomName} — ${data.orgName}`,
        `**Người đặt:** ${data.bookerName}`,
        `**Ngày:** ${formatDate(data.startTime)}`,
        `**Thời gian:** ${formatTime(data.startTime)} – ${formatTime(data.endTime)}`,
        "",
    ].join("\n");
}

export function buildBookingCancelledMessage(data: BookingNotificationData): string {
    return [
        `❌ [**Huỷ đặt phòng** #${data.orgTag}](${buildRoomUrl(data.roomId)})`,
        "",
        `**Phòng:** ${data.roomName} — ${data.orgName}`,
        `**Người đặt:** ${data.bookerName}`,
        `**Ngày:** ${formatDate(data.startTime)}`,
        `**Thời gian:** ${formatTime(data.startTime)} – ${formatTime(data.endTime)}`,
        "",
    ].join("\n");
}

async function notifyLinkedChannels(orgId: string, message: string): Promise<void> {
    const channels = await prisma.discordChannel.findMany({
        where: {organizationId: orgId},
        select: {channelId: true},
    });

    for (const channel of channels) {
        sendDiscordMessage(channel.channelId, message);
    }
}

export function notifyBookingCreated(orgId: string, data: BookingNotificationData): void {
    if (!process.env.DISCORD_BOT_TOKEN) return;
    const message = buildBookingCreatedMessage(data);
    notifyLinkedChannels(orgId, message);
}

export function notifyBookingCancelled(orgId: string, data: BookingNotificationData): void {
    if (!process.env.DISCORD_BOT_TOKEN) return;
    const message = buildBookingCancelledMessage(data);
    notifyLinkedChannels(orgId, message);
}
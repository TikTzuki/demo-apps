import {prisma} from "@/lib/prisma";

const TELEGRAM_API = "https://api.telegram.org/bot";

function getBotToken(): string | undefined {
    return process.env.TELEGRAM_BOT_TOKEN;
}

export async function sendTelegramMessage(
    chatId: string,
    message: string
): Promise<void> {
    const botToken = getBotToken();
    if (!botToken) return;

    try {
        const url = `${TELEGRAM_API}${botToken}/sendMessage`;
        const res = await fetch(url, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: "HTML",
            }),
        });

        if (!res.ok) {
            const body = await res.text();
            console.error(`Telegram API error ${res.status}: ${body}`);
        }
    } catch (err) {
        console.error("Failed to send Telegram notification:", err);
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
    // let l = buildRoomUrl(data.roomId);
    let l = "https://testhehe.tiktuzki.com/rooms/123";
    return [
        `📅 <a href="${buildRoomUrl(data.roomId)}"><b>Đặt phòng mới</b> #${data.orgTag}</a>`,
        "",
        `<b>Phòng:</b> ${data.roomName} — ${data.orgName}`,
        `<b>Người đặt:</b> ${data.bookerName}`,
        `<b>Ngày:</b> ${formatDate(data.startTime)}`,
        `<b>Thời gian:</b> ${formatTime(data.startTime)} – ${formatTime(data.endTime)}`,
        "",
    ].join("\n");
}

export function buildBookingCancelledMessage(data: BookingNotificationData): string {
    // let l = buildRoomUrl(data.roomId);
    return [
        `❌ <a href="${buildRoomUrl(data.roomId)}"><b>Huỷ đặt phòng</b> #${data.orgTag}</a>`,
        "",
        `<b>Phòng:</b> ${data.roomName} — ${data.orgName}`,
        `<b>Người đặt:</b> ${data.bookerName}`,
        `<b>Ngày:</b> ${formatDate(data.startTime)}`,
        `<b>Thời gian:</b> ${formatTime(data.startTime)} – ${formatTime(data.endTime)}`,
        "",
    ].join("\n");
}

async function notifyLinkedGroups(orgId: string, message: string): Promise<void> {
    const groups = await prisma.telegramGroup.findMany({
        where: {organizationId: orgId},
        select: {chatId: true},
    });

    for (const group of groups) {
        sendTelegramMessage(group.chatId, message);
    }
}

export function notifyBookingCreated(orgId: string, data: BookingNotificationData): void {
    if (!getBotToken()) return;
    const message = buildBookingCreatedMessage(data);
    notifyLinkedGroups(orgId, message);
}

export function notifyBookingCancelled(orgId: string, data: BookingNotificationData): void {
    if (!getBotToken()) return;
    const message = buildBookingCancelledMessage(data);
    notifyLinkedGroups(orgId, message);
}

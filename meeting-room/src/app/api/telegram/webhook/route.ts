import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {sendTelegramMessage} from "@/lib/telegram";

interface TelegramUpdate {
    message?: {
        chat: {
            id: number;
            title?: string;
            type: string;
        };
        text?: string;
        from?: {
            first_name?: string;
            username?: string;
        };
    };
}

export async function POST(request: NextRequest) {
    try {
        const update: TelegramUpdate = await request.json();
        const message = update.message;

        if (!message?.text) {
            return NextResponse.json({ok: true});
        }

        const text = message.text.trim();

        // Handle /link <tag> command
        const linkMatch = text.match(/^\/link(?:@\S+)?\s+(\S+)$/);
        if (linkMatch) {
            await handleLinkCommand(
                message.chat.id.toString(),
                message.chat.title ?? null,
                linkMatch[1]
            );
            return NextResponse.json({ok: true});
        }

        // Handle /unlink <tag> command
        const unlinkMatch = text.match(/^\/unlink(?:@\S+)?\s+(\S+)$/);
        if (unlinkMatch) {
            await handleUnlinkCommand(
                message.chat.id.toString(),
                unlinkMatch[1]
            );
            return NextResponse.json({ok: true});
        }

        return NextResponse.json({ok: true});
    } catch {
        return NextResponse.json({ok: true});
    }
}

async function handleLinkCommand(
    chatId: string,
    chatTitle: string | null,
    tag: string
): Promise<void> {
    const normalizedTag = tag.toLowerCase();

    const org = await prisma.organization.findUnique({
        where: {tag: normalizedTag},
    });

    if (!org) {
        await sendTelegramMessage(chatId, `Organization with tag <b>${normalizedTag}</b> not found.`);
        return;
    }

    const existing = await prisma.telegramGroup.findUnique({
        where: {chatId_organizationId: {chatId, organizationId: org.id}},
    });

    if (existing) {
        await sendTelegramMessage(chatId, `This group is already linked to <b>${org.name}</b>.`);
        return;
    }

    await prisma.telegramGroup.create({
        data: {
            chatId,
            chatTitle,
            organizationId: org.id,
        },
    });

    await sendTelegramMessage(
        chatId,
        `Linked to <b>${org.name}</b> (#${org.tag}). Booking notifications will be sent here.`
    );
}

async function handleUnlinkCommand(
    chatId: string,
    tag: string
): Promise<void> {
    const normalizedTag = tag.toLowerCase();

    const org = await prisma.organization.findUnique({
        where: {tag: normalizedTag},
    });

    if (!org) {
        await sendTelegramMessage(chatId, `Organization with tag <b>${normalizedTag}</b> not found.`);
        return;
    }

    const deleted = await prisma.telegramGroup.deleteMany({
        where: {chatId, organizationId: org.id},
    });

    if (deleted.count === 0) {
        await sendTelegramMessage(chatId, `This group is not linked to <b>${org.name}</b>.`);
        return;
    }

    await sendTelegramMessage(
        chatId,
        `Unlinked from <b>${org.name}</b> (#${org.tag}). Notifications will no longer be sent here.`
    );
}

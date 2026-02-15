import {NextRequest, NextResponse} from "next/server";
import {InteractionResponseType, InteractionType,} from "discord-api-types/v10";
import {prisma} from "@/lib/prisma";

interface DiscordInteraction {
    type: number;
    data?: {
        name: string;
        options?: Array<{ name: string; value: string }>;
    };
    channel_id?: string;
    guild_id?: string;
    guild?: { name?: string };
}

export async function POST(request: NextRequest) {
    const body = await request.text();

    const isValid = await verifyDiscordSignature(request, body);
    if (!isValid) {
        return NextResponse.json({error: "Invalid signature"}, {status: 401});
    }

    const interaction: DiscordInteraction = JSON.parse(body);

    if (interaction.type === InteractionType.Ping) {
        return NextResponse.json({type: InteractionResponseType.Pong});
    }

    if (interaction.type === InteractionType.ApplicationCommand) {
        const commandName = interaction.data?.name;
        const tag = interaction.data?.options?.find((o) => o.name === "tag")?.value;
        const channelId = interaction.channel_id;
        const guildId = interaction.guild_id;
        const guildName = interaction.guild?.name ?? null;

        if (!tag || !channelId || !guildId) {
            return jsonCommandResponse("Missing required parameters.");
        }

        if (commandName === "link") {
            const message = await handleLinkCommand(channelId, guildId, guildName, tag);
            return jsonCommandResponse(message);
        }

        if (commandName === "unlink") {
            const message = await handleUnlinkCommand(channelId, guildId, tag);
            return jsonCommandResponse(message);
        }

        return jsonCommandResponse("Unknown command.");
    }

    return NextResponse.json({ok: true});
}

function jsonCommandResponse(content: string) {
    return NextResponse.json({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {content},
    });
}

async function verifyDiscordSignature(
    request: NextRequest,
    body: string
): Promise<boolean> {
    const publicKey = process.env.DISCORD_PUBLIC_KEY;
    if (!publicKey) return false;

    const signature = request.headers.get("x-signature-ed25519");
    const timestamp = request.headers.get("x-signature-timestamp");
    if (!signature || !timestamp) return false;

    try {
        const encoder = new TextEncoder();
        const message = encoder.encode(timestamp + body).buffer as ArrayBuffer;

        const keyBytes = hexToUint8Array(publicKey).buffer as ArrayBuffer;
        const sigBytes = hexToUint8Array(signature).buffer as ArrayBuffer;

        const cryptoKey = await crypto.subtle.importKey(
            "raw",
            keyBytes,
            {name: "Ed25519", namedCurve: "Ed25519"},
            false,
            ["verify"]
        );

        return await crypto.subtle.verify("Ed25519", cryptoKey, sigBytes, message);
    } catch {
        return false;
    }
}

function hexToUint8Array(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
}

async function handleLinkCommand(
    channelId: string,
    guildId: string,
    guildName: string | null,
    tag: string
): Promise<string> {
    const normalizedTag = tag.toLowerCase();

    const org = await prisma.organization.findUnique({
        where: {tag: normalizedTag},
    });

    if (!org) {
        return `Organization with tag **${normalizedTag}** not found.`;
    }

    const existing = await prisma.discordChannel.findUnique({
        where: {channelId_organizationId: {channelId, organizationId: org.id}},
    });

    if (existing) {
        return `This channel is already linked to **${org.name}**.`;
    }

    await prisma.discordChannel.create({
        data: {
            channelId,
            guildId,
            guildName,
            organizationId: org.id,
        },
    });

    return `Linked to **${org.name}** (#${org.tag}). Booking notifications will be sent here.`;
}

async function handleUnlinkCommand(
    channelId: string,
    guildId: string,
    tag: string
): Promise<string> {
    const normalizedTag = tag.toLowerCase();

    const org = await prisma.organization.findUnique({
        where: {tag: normalizedTag},
    });

    if (!org) {
        return `Organization with tag **${normalizedTag}** not found.`;
    }

    const deleted = await prisma.discordChannel.deleteMany({
        where: {channelId, organizationId: org.id},
    });

    if (deleted.count === 0) {
        return `This channel is not linked to **${org.name}**.`;
    }

    return `Unlinked from **${org.name}** (#${org.tag}). Notifications will no longer be sent here.`;
}
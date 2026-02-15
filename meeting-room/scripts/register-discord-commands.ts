import {REST} from "@discordjs/rest";
import {ApplicationCommandOptionType, Routes} from "discord-api-types/v10";

const token = process.env.DISCORD_BOT_TOKEN!;
const appId = process.env.DISCORD_APP_ID!;

if (!token || !appId) {
    console.error("DISCORD_BOT_TOKEN and DISCORD_APP_ID are required");
    process.exit(1);
}

const commands = [
    {
        name: "link",
        description: "Link this channel to an organization for booking notifications",
        options: [
            {
                name: "tag",
                type: ApplicationCommandOptionType.String,
                description: "Organization tag (e.g. myorg4)",
                required: true,
            },
        ],
    },
    {
        name: "unlink",
        description: "Unlink this channel from an organization",
        options: [
            {
                name: "tag",
                type: ApplicationCommandOptionType.String,
                description: "Organization tag (e.g. myorg4)",
                required: true,
            },
        ],
    },
];

const rest = new REST({version: "10"}).setToken(token);

async function main() {
    console.log("Registering Discord slash commands...");

    const data = await rest.put(Routes.applicationCommands(appId), {
        body: commands,
    });

    console.log(`Registered ${(data as Array<unknown>).length} commands.`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
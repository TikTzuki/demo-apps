import {PrismaPg} from "@prisma/adapter-pg";
import {PrismaClient} from "@prisma/client";
import {promises as fs} from "fs";
import path from "path";

const TEAM_COLORS = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
    "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
    "#F8B500", "#00CED1", "#FF69B4", "#90EE90",
];

async function main() {
    const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL});
    const prisma = new PrismaClient({adapter});

    const dbPath = path.join(process.cwd(), "data", "database.json");

    let data: {
        teams: {
            id?: string;
            name: string;
            color?: string;
            members: { id?: string; name: string; email?: string; checkedIn?: boolean; checkedInAt?: string }[]
        }[]
    };
    try {
        const raw = await fs.readFile(dbPath, "utf-8");
        data = JSON.parse(raw);
    } catch {
        console.log("No data/database.json found, skipping seed.");
        await prisma.$disconnect();
        return;
    }

    for (const [index, team] of data.teams.entries()) {
        const created = await prisma.team.create({
            data: {
                name: team.name,
                color: team.color || TEAM_COLORS[index % TEAM_COLORS.length],
                members: {
                    create: team.members.map((m) => ({
                        name: m.name.trim(),
                        email: m.email || null,
                        checkedIn: m.checkedIn ?? false,
                        checkedInAt: m.checkedInAt ? new Date(m.checkedInAt) : null,
                    })),
                },
            },
        });
        console.log(`Created team: ${created.name} (${created.id})`);
    }

    // Add Lì Xì team
    const lixiTeam = await prisma.team.create({
        data: {
            name: "Lì Xì",
            color: "#c0392b",
            members: {
                create: [
                    {name: "Mr. Lộc"},
                    {name: "Mr. Thiện"},
                    {name: "Mr. Tân"},
                    {name: "Mr. Long"},
                    {name: "Mr. Huy"},
                ],
            },
        },
    });
    console.log(`Created team: ${lixiTeam.name} (${lixiTeam.id})`);

    console.log("Seed complete.");
    await prisma.$disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});

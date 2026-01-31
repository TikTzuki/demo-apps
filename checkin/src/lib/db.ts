import {promises as fs} from "fs";
import path from "path";
import {CheckinStats, Database, Member, Team, TeamStats} from "./types";
import {getTeamColor} from "./utils";

const DB_PATH = path.join(process.cwd(), "data", "database.json");

export async function readDatabase(): Promise<Database> {
    try {
        const data = await fs.readFile(DB_PATH, "utf-8");
        return JSON.parse(data);
    } catch {
        // Return empty database if file doesn't exist
        return {teams: []};
    }
}

export async function writeDatabase(data: Database): Promise<void> {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export async function getTeams(): Promise<Team[]> {
    const db = await readDatabase();
    return db.teams;
}

export async function getTeamById(teamId: string): Promise<Team | null> {
    const db = await readDatabase();
    return db.teams.find((t) => t.id === teamId) || null;
}

export async function checkinMember(
    teamId: string,
    memberId: string
): Promise<{ success: boolean; member?: Member; error?: string }> {
    const db = await readDatabase();
    const team = db.teams.find((t) => t.id === teamId);

    if (!team) {
        return {success: false, error: "Team không tồn tại"};
    }

    const member = team.members.find((m) => m.id === memberId);

    if (!member) {
        return {success: false, error: "Thành viên không tồn tại"};
    }

    if (member.checkedIn) {
        return {success: false, error: "Thành viên đã check-in rồi"};
    }

    member.checkedIn = true;
    member.checkedInAt = new Date().toISOString();

    await writeDatabase(db);

    return {success: true, member};
}

export async function uncheckinMember(
    memberId: string
): Promise<{ success: boolean; member?: Member; error?: string }> {
    const db = await readDatabase();

    for (const team of db.teams) {
        const member = team.members.find((m) => m.id === memberId);
        if (member) {
            if (!member.checkedIn) {
                return {success: false, error: "Thành viên chưa check-in"};
            }

            member.checkedIn = false;
            member.checkedInAt = undefined;

            await writeDatabase(db);

            return {success: true, member};
        }
    }

    return {success: false, error: "Thành viên không tồn tại"};
}

export async function getStats(): Promise<CheckinStats> {
    const db = await readDatabase();

    let totalMembers = 0;
    let checkedIn = 0;
    const teamStats: TeamStats[] = [];

    db.teams.forEach((team, index) => {
        const teamTotal = team.members.length;
        const teamCheckedIn = team.members.filter((m) => m.checkedIn).length;

        totalMembers += teamTotal;
        checkedIn += teamCheckedIn;

        teamStats.push({
            teamId: team.id,
            teamName: team.name,
            color: team.color || getTeamColor(index),
            totalMembers: teamTotal,
            checkedIn: teamCheckedIn,
            isComplete: teamCheckedIn === teamTotal,
        });
    });

    const percentage = totalMembers > 0 ? (checkedIn / totalMembers) * 100 : 0;

    return {
        totalMembers,
        checkedIn,
        percentage: Math.round(percentage * 10) / 10,
        teamStats,
    };
}

// Initialize database from old format
export async function initializeDatabase(): Promise<void> {
    const oldDbPath = path.join(process.cwd(), "database.json");

    try {
        const oldData = await fs.readFile(oldDbPath, "utf-8");
        const parsed = JSON.parse(oldData);

        // Check if it's old format (teams without ids)
        if (parsed.teams && parsed.teams[0] && !parsed.teams[0].id) {
            const newTeams: Team[] = parsed.teams.map(
                (
                    team: { name: string; members: { name: string; email?: string }[] },
                    index: number
                ) => ({
                    id: `team-${index + 1}`,
                    name: team.name,
                    color: getTeamColor(index),
                    members: team.members.map(
                        (member: { name: string; email?: string }, mIndex: number) => ({
                            id: `member-${index + 1}-${mIndex + 1}`,
                            name: member.name.trim(),
                            email: member.email,
                            checkedIn: false,
                        })
                    ),
                })
            );

            await writeDatabase({teams: newTeams});
            console.log("Database initialized successfully");
        }
    } catch {
        console.log("No old database to migrate");
    }
}

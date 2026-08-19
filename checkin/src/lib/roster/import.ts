import {prisma} from "@/lib/prisma";
import {getTeamColor} from "@/lib/utils";
import type {RosterIssue, RosterRow} from "./parse";

/**
 * Applies a parsed roster to the database.
 *
 * Keyed on `employeeCode`, which is unique in the schema: an existing employee is
 * updated in place, so their attendance history is never orphaned. People absent
 * from the file are left alone — a truncated export must not wipe the roster.
 */

export type RosterAction = "created" | "updated" | "unchanged";

export interface RosterChange {
    rowNumber: number;
    employeeCode: string;
    name: string;
    teamName: string;
    action: RosterAction;
    /** What the update changes, for the preview: "tên", "phòng ban", … */
    changes: string[];
}

export interface RosterResult {
    dryRun: boolean;
    created: number;
    updated: number;
    unchanged: number;
    teamsCreated: string[];
    changes: RosterChange[];
    issues: RosterIssue[];
}

/** Case- and whitespace-insensitive team lookup, so "Kỹ thuật" and "kỹ thuật " are one team. */
function teamKey(name: string): string {
    return name.trim().toLowerCase();
}

export async function importRoster(
    rows: readonly RosterRow[],
    issues: readonly RosterIssue[],
    options: { dryRun: boolean }
): Promise<RosterResult> {
    const {dryRun} = options;

    const [existingTeams, existingMembers] = await Promise.all([
        prisma.team.findMany(),
        prisma.member.findMany({where: {employeeCode: {not: null}}}),
    ]);

    const teamsByKey = new Map(existingTeams.map((t) => [teamKey(t.name), t]));
    const membersByCode = new Map(
        existingMembers.map((m) => [m.employeeCode!.toLowerCase(), m])
    );

    const teamsCreated: string[] = [];
    const changes: RosterChange[] = [];
    let teamCount = existingTeams.length;

    for (const row of rows) {
        const key = teamKey(row.teamName);
        let team = teamsByKey.get(key);

        if (!team) {
            if (!teamsCreated.includes(row.teamName)) teamsCreated.push(row.teamName);
            if (dryRun) {
                // Stand-in so later rows in the same new team don't re-report it.
                team = {id: `<new>${key}`, name: row.teamName, color: getTeamColor(teamCount), createdAt: new Date()};
            } else {
                team = await prisma.team.create({
                    data: {name: row.teamName.trim(), color: getTeamColor(teamCount)},
                });
            }
            teamsByKey.set(key, team);
            teamCount += 1;
        }

        const existing = membersByCode.get(row.employeeCode.toLowerCase());

        if (!existing) {
            if (!dryRun) {
                await prisma.member.create({
                    data: {
                        name: row.name,
                        employeeCode: row.employeeCode,
                        email: row.email ?? null,
                        teamId: team.id,
                    },
                });
            }
            changes.push({...rowSummary(row), action: "created", changes: []});
            continue;
        }

        const diff: string[] = [];
        if (existing.name !== row.name) diff.push("tên");
        if (existing.teamId !== team.id) diff.push("phòng ban");
        if ((existing.email ?? undefined) !== row.email) diff.push("email");
        // Someone reappearing in the roster is being re-hired, not left inactive.
        if (!existing.isActive) diff.push("trạng thái");

        if (diff.length === 0) {
            changes.push({...rowSummary(row), action: "unchanged", changes: []});
            continue;
        }

        if (!dryRun) {
            await prisma.member.update({
                where: {id: existing.id},
                data: {
                    name: row.name,
                    teamId: team.id,
                    email: row.email ?? null,
                    isActive: true,
                },
            });
        }
        changes.push({...rowSummary(row), action: "updated", changes: diff});
    }

    return {
        dryRun,
        created: changes.filter((c) => c.action === "created").length,
        updated: changes.filter((c) => c.action === "updated").length,
        unchanged: changes.filter((c) => c.action === "unchanged").length,
        teamsCreated,
        changes,
        issues: [...issues],
    };
}

function rowSummary(row: RosterRow) {
    return {
        rowNumber: row.rowNumber,
        employeeCode: row.employeeCode,
        name: row.name,
        teamName: row.teamName,
    };
}

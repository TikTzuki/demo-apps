import {prisma} from "./prisma";
import {CheckinStats, Member, Team, TeamStats} from "./types";
import {getTeamColor} from "./utils";

function formatMember(m: {
    id: string;
    name: string;
    email: string | null;
    checkedIn: boolean;
    checkedInAt: Date | null
}): Member {
    return {
        id: m.id,
        name: m.name,
        email: m.email ?? undefined,
        checkedIn: m.checkedIn,
        checkedInAt: m.checkedInAt?.toISOString(),
    };
}

function formatTeam(t: {
    id: string;
    name: string;
    color: string;
    members: { id: string; name: string; email: string | null; checkedIn: boolean; checkedInAt: Date | null }[]
}): Team {
    return {
        id: t.id,
        name: t.name,
        color: t.color,
        members: t.members.map(formatMember),
    };
}

export async function getTeams(): Promise<Team[]> {
    const teams = await prisma.team.findMany({
        include: {members: true},
        orderBy: {createdAt: "asc"},
    });
    return teams.map(formatTeam);
}

export async function getTeamById(teamId: string): Promise<Team | null> {
    const team = await prisma.team.findUnique({
        where: {id: teamId},
        include: {members: true},
    });
    return team ? formatTeam(team) : null;
}

export async function checkinMember(
    teamId: string,
    memberId: string
): Promise<{ success: boolean; member?: Member; error?: string }> {
    const member = await prisma.member.findUnique({
        where: {id: memberId},
    });

    if (!member) {
        return {success: false, error: "Thành viên không tồn tại"};
    }

    if (member.teamId !== teamId) {
        return {success: false, error: "Team không tồn tại"};
    }

    if (member.checkedIn) {
        return {success: false, error: "Thành viên đã check-in rồi"};
    }

    const updated = await prisma.member.update({
        where: {id: memberId},
        data: {checkedIn: true, checkedInAt: new Date()},
    });

    return {success: true, member: formatMember(updated)};
}

export async function uncheckinMember(
    memberId: string
): Promise<{ success: boolean; member?: Member; error?: string }> {
    const member = await prisma.member.findUnique({
        where: {id: memberId},
    });

    if (!member) {
        return {success: false, error: "Thành viên không tồn tại"};
    }

    if (!member.checkedIn) {
        return {success: false, error: "Thành viên chưa check-in"};
    }

    const updated = await prisma.member.update({
        where: {id: memberId},
        data: {checkedIn: false, checkedInAt: null},
    });

    return {success: true, member: formatMember(updated)};
}

export async function getStats(): Promise<CheckinStats> {
    const teams = await prisma.team.findMany({
        include: {members: true},
        orderBy: {createdAt: "asc"},
    });

    let totalMembers = 0;
    let checkedIn = 0;
    const teamStats: TeamStats[] = [];

    teams.forEach((team, index) => {
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

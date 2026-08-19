import {prisma} from "@/lib/prisma";
import {type AttendancePolicy, computeDay, type DaySummary, type SessionInput} from "./compute";
import {parseHHmm, localMinutesOfDay, workDateOf} from "./time";
import type {MemberAttendance, TeamAttendance} from "@/lib/types";

/** Rows as Prisma returns them, narrowed to what the computation needs. */
type SessionRow = {
    id: string;
    memberId: string;
    workDate: Date;
    checkInAt: Date;
    checkOutAt: Date | null;
    kind: string;
    note: string | null;
    isManual: boolean;
    autoClosedAt?: Date | null;
    reviewedAt?: Date | null;
};

export function toSessionInput(row: SessionRow): SessionInput {
    return {
        id: row.id,
        workDate: row.workDate,
        checkInAt: row.checkInAt,
        checkOutAt: row.checkOutAt,
        kind: row.kind === "OVERNIGHT" ? "OVERNIGHT" : "DAY",
        note: row.note,
        isManual: row.isManual,
        autoClosedAt: row.autoClosedAt ?? null,
        reviewedAt: row.reviewedAt ?? null,
    };
}

/** Group rows by member id without mutating the input. */
function groupByMember(rows: readonly SessionRow[]): ReadonlyMap<string, SessionRow[]> {
    return rows.reduce((acc, row) => {
        const existing = acc.get(row.memberId) ?? [];
        return acc.set(row.memberId, [...existing, row]);
    }, new Map<string, SessionRow[]>());
}

/**
 * Turn a computed day into the shape the kiosk renders.
 *
 * `canCheckInOvernight` is what lets someone who already went home come back
 * for a night shift, without letting them start a second day shift at 15:00.
 */
function toMemberAttendance(
    member: { id: string; name: string; email: string | null; employeeCode: string | null; teamId: string },
    day: DaySummary,
    policy: AttendancePolicy,
    now: Date
): MemberAttendance {
    const openSession = day.sessions.find((s) => s.isOpen && !s.isStale) ?? null;
    const hasClosed = day.sessions.some((s) => !s.isOpen);
    const pastOvernightStart = localMinutesOfDay(now, policy) >= parseHHmm(policy.overnightStartTime)
        || localMinutesOfDay(now, policy) < policy.dayCutoffHour * 60;

    const state = openSession !== null ? "WORKING" : hasClosed ? "DONE" : "OUT";

    return {
        id: member.id,
        name: member.name,
        email: member.email ?? undefined,
        employeeCode: member.employeeCode ?? undefined,
        teamId: member.teamId,
        state,
        openedAt: openSession?.checkInAt.toISOString(),
        lastCheckOutAt: day.lastCheckOutAt?.toISOString(),
        isOvernightSession: openSession?.kind === "OVERNIGHT",
        workedMinutes: day.workedMinutes,
        regularMinutes: day.regularMinutes,
        otMinutes: day.otMinutes,
        overnightOtMinutes: day.overnightOtMinutes,
        statuses: day.statuses,
        canCheckInOvernight: state === "DONE" && pastOvernightStart,
    };
}

/** Every team with each member's live state for the given business day. */
export async function getTeamAttendance(
    workDate: Date,
    policy: AttendancePolicy,
    now: Date
): Promise<TeamAttendance[]> {
    const [teams, sessions] = await Promise.all([
        prisma.team.findMany({
            include: {members: {where: {isActive: true}, orderBy: {createdAt: "asc"}}},
            orderBy: {createdAt: "asc"},
        }),
        // Also pull sessions still open from an earlier day, so a forgotten
        // check-out surfaces on the board instead of silently vanishing.
        prisma.attendanceSession.findMany({where: {OR: [{workDate}, {checkOutAt: null}]}}),
    ]);

    const byMember = groupByMember(sessions);

    return teams.map((team) => {
        const members = team.members.map((member) => {
            const rows = byMember.get(member.id) ?? [];
            const day = computeDay(workDate, rows.map(toSessionInput), policy, now);
            return toMemberAttendance(member, day, policy, now);
        });

        return {
            id: team.id,
            name: team.name,
            color: team.color,
            members,
            workingCount: members.filter((m) => m.state === "WORKING").length,
            doneCount: members.filter((m) => m.state === "DONE").length,
            otCount: members.filter((m) => m.otMinutes > 0).length,
        };
    });
}

/** One member's day — used by the check-in/check-out actions. */
export async function getMemberDay(
    memberId: string,
    workDate: Date,
    policy: AttendancePolicy,
    now: Date
): Promise<DaySummary> {
    const rows = await prisma.attendanceSession.findMany({where: {memberId, workDate}});
    return computeDay(workDate, rows.map(toSessionInput), policy, now);
}

/**
 * A member's currently open session, wherever it started.
 *
 * Deliberately not scoped to today's `workDate`: a night shift that began
 * yesterday at 22:00 must still be closeable at 02:00.
 */
export async function findOpenSession(memberId: string) {
    return prisma.attendanceSession.findFirst({
        where: {memberId, checkOutAt: null},
        orderBy: {checkInAt: "desc"},
    });
}

export interface RangeRow {
    workDate: Date;
    teamName: string;
    teamColor: string;
    memberId: string;
    memberName: string;
    employeeCode: string | null;
    day: DaySummary;
}

/** Every member-day in a date range, for the admin table and the Excel export. */
export async function getRange(
    from: Date,
    to: Date,
    policy: AttendancePolicy,
    now: Date,
    teamId?: string
): Promise<RangeRow[]> {
    const sessions = await prisma.attendanceSession.findMany({
        where: {
            workDate: {gte: from, lte: to},
            ...(teamId ? {member: {teamId}} : {}),
        },
        include: {member: {include: {team: true}}},
        orderBy: [{workDate: "asc"}, {checkInAt: "asc"}],
    });

    // Key on (member, day) so both legs of an overnight shift land in one row.
    const buckets = sessions.reduce((acc, row) => {
        const key = `${row.memberId}|${row.workDate.toISOString()}`;
        const existing = acc.get(key) ?? [];
        return acc.set(key, [...existing, row]);
    }, new Map<string, typeof sessions>());

    return [...buckets.values()].map((rows) => {
        const first = rows[0];
        return {
            workDate: first.workDate,
            teamName: first.member.team.name,
            teamColor: first.member.team.color,
            memberId: first.memberId,
            memberName: first.member.name,
            employeeCode: first.member.employeeCode,
            day: computeDay(first.workDate, rows.map(toSessionInput), policy, now),
        };
    }).sort((a, b) =>
        a.workDate.getTime() - b.workDate.getTime()
        || a.teamName.localeCompare(b.teamName, "vi")
        || a.memberName.localeCompare(b.memberName, "vi")
    );
}

/** The business day it is right now. */
export function currentWorkDate(policy: AttendancePolicy, now: Date): Date {
    return workDateOf(now, policy);
}

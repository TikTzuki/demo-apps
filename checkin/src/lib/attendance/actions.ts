import {prisma} from "@/lib/prisma";
import {classifyKind, type AttendancePolicy} from "./compute";
import {findOpenSession, getMemberDay} from "./queries";
import {MINUTE_MS, workDateOf} from "./time";

export interface ActionResult {
    success: boolean;
    error?: string;
    data?: {
        memberName: string;
        action: "CHECK_IN" | "CHECK_OUT";
        kind: "DAY" | "OVERNIGHT";
        at: string;
        workedMinutes: number;
        regularMinutes: number;
        otMinutes: number;
        overnightOtMinutes: number;
    };
}

/**
 * Open a session.
 *
 * A session left open beyond `maxSessionHours` is treated as abandoned: the new
 * check-in is allowed and the old row stays open and flagged for an admin to
 * correct. Blocking someone from working all day is worse than a flagged record,
 * and we still never invent a check-out time.
 */
export async function checkIn(memberId: string, policy: AttendancePolicy, now: Date): Promise<ActionResult> {
    const member = await prisma.member.findUnique({where: {id: memberId}});
    if (!member || !member.isActive) {
        return {success: false, error: "Nhân viên không tồn tại"};
    }

    const open = await findOpenSession(memberId);
    if (open) {
        const openMs = now.getTime() - open.checkInAt.getTime();
        const isStale = openMs > policy.maxSessionHours * 60 * MINUTE_MS;
        if (!isStale) {
            return {success: false, error: "Bạn đang trong ca làm việc, hãy check-out trước"};
        }
    }

    const workDate = workDateOf(now, policy);
    const kind = classifyKind(now, policy);

    await prisma.attendanceSession.create({
        data: {memberId, workDate, checkInAt: now, kind},
    });

    const day = await getMemberDay(memberId, workDate, policy, now);

    return {
        success: true,
        data: {
            memberName: member.name,
            action: "CHECK_IN",
            kind,
            at: now.toISOString(),
            workedMinutes: day.workedMinutes,
            regularMinutes: day.regularMinutes,
            otMinutes: day.otMinutes,
            overnightOtMinutes: day.overnightOtMinutes,
        },
    };
}

/** Close the open session and report what the day now totals. */
export async function checkOut(memberId: string, policy: AttendancePolicy, now: Date): Promise<ActionResult> {
    const member = await prisma.member.findUnique({where: {id: memberId}});
    if (!member || !member.isActive) {
        return {success: false, error: "Nhân viên không tồn tại"};
    }

    const open = await findOpenSession(memberId);
    if (!open) {
        return {success: false, error: "Bạn chưa check-in"};
    }
    if (now <= open.checkInAt) {
        return {success: false, error: "Giờ check-out phải sau giờ check-in"};
    }

    await prisma.attendanceSession.update({
        where: {id: open.id},
        data: {checkOutAt: now},
    });

    // Report against the session's own business day, which for a night shift is
    // yesterday even though it is now past midnight.
    const day = await getMemberDay(memberId, open.workDate, policy, now);

    return {
        success: true,
        data: {
            memberName: member.name,
            action: "CHECK_OUT",
            kind: open.kind === "OVERNIGHT" ? "OVERNIGHT" : "DAY",
            at: now.toISOString(),
            workedMinutes: day.workedMinutes,
            regularMinutes: day.regularMinutes,
            otMinutes: day.otMinutes,
            overnightOtMinutes: day.overnightOtMinutes,
        },
    };
}

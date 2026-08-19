import type {AttendanceBoard} from "@/lib/types";
import {getPolicy} from "./settings";
import {currentWorkDate, getTeamAttendance} from "./queries";
import {workDateKey} from "./time";

/** The live kiosk board for the current business day. */
export async function getBoard(now = new Date()): Promise<AttendanceBoard> {
    const policy = await getPolicy();
    const workDate = currentWorkDate(policy, now);
    const teams = await getTeamAttendance(workDate, policy, now);

    const members = teams.flatMap((team) => team.members);

    return {
        workDate: workDateKey(workDate),
        serverTime: now.toISOString(),
        policy: {
            timezoneOffsetMinutes: policy.timezoneOffsetMinutes,
            otStartTime: policy.otStartTime,
            overnightStartTime: policy.overnightStartTime,
            lateAfterTime: policy.lateAfterTime,
            shiftStartTime: policy.shiftStartTime,
        },
        teams,
        totals: {
            totalMembers: members.length,
            working: members.filter((m) => m.state === "WORKING").length,
            done: members.filter((m) => m.state === "DONE").length,
            absent: members.filter((m) => m.state === "OUT").length,
            onOt: members.filter((m) => m.otMinutes > 0).length,
            onOvernight: members.filter((m) => m.overnightOtMinutes > 0 || m.isOvernightSession).length,
        },
    };
}

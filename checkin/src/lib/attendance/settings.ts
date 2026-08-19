import {prisma} from "@/lib/prisma";
import {type AttendancePolicy, DEFAULT_POLICY} from "./compute";

export const SETTINGS_ID = "default";

/**
 * The active attendance policy.
 *
 * Falls back to `DEFAULT_POLICY` when the row is missing, so the kiosk keeps
 * working on a freshly-migrated database that has not been seeded yet.
 */
export async function getPolicy(): Promise<AttendancePolicy> {
    const row = await prisma.attendanceSetting.findUnique({where: {id: SETTINGS_ID}});
    if (!row) return DEFAULT_POLICY;

    return {
        timezoneOffsetMinutes: row.timezoneOffsetMinutes,
        dayCutoffHour: row.dayCutoffHour,
        shiftStartTime: row.shiftStartTime,
        lateAfterTime: row.lateAfterTime,
        otStartTime: row.otStartTime,
        overnightStartTime: row.overnightStartTime,
        standardShiftMinutes: row.standardShiftMinutes,
        breakMinutes: row.breakMinutes,
        breakStartTime: row.breakStartTime,
        otMinMinutes: row.otMinMinutes,
        maxSessionHours: row.maxSessionHours,
    };
}

export async function updatePolicy(patch: Partial<AttendancePolicy>): Promise<AttendancePolicy> {
    await prisma.attendanceSetting.upsert({
        where: {id: SETTINGS_ID},
        create: {id: SETTINGS_ID, ...DEFAULT_POLICY, ...patch},
        update: patch,
    });
    return getPolicy();
}

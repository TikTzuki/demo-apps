import {NextResponse} from "next/server";
import {z} from "zod";
import {withAdmin} from "@/lib/auth/guard";
import {getPolicy, updatePolicy} from "@/lib/attendance/settings";

export const dynamic = "force-dynamic";

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Giờ phải theo định dạng HH:mm");

const updateSchema = z
    .object({
        timezoneOffsetMinutes: z.number().int().min(-720).max(840),
        dayCutoffHour: z.number().int().min(0).max(12),
        shiftStartTime: hhmm,
        lateAfterTime: hhmm,
        otStartTime: hhmm,
        overnightStartTime: hhmm,
        standardShiftMinutes: z.number().int().min(60).max(1440),
        breakMinutes: z.number().int().min(0).max(240),
        breakStartTime: hhmm,
        otMinMinutes: z.number().int().min(0).max(240),
        maxSessionHours: z.number().int().min(1).max(48),
    })
    .partial()
    .refine((v) => Object.keys(v).length > 0, "Không có thay đổi nào");

export const GET = withAdmin(async () => {
    try {
        return NextResponse.json({success: true, data: await getPolicy()});
    } catch (error) {
        console.error("Error loading settings:", error);
        return NextResponse.json({success: false, error: "Không thể tải cấu hình"}, {status: 500});
    }
});

export const PATCH = withAdmin(async (_admin, request: Request) => {
    try {
        const parsed = updateSchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json(
                {success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ"},
                {status: 400}
            );
        }

        const merged = {...(await getPolicy()), ...parsed.data};
        if (merged.overnightStartTime <= merged.otStartTime) {
            return NextResponse.json(
                {success: false, error: "Giờ bắt đầu ca đêm phải sau giờ bắt đầu OT"},
                {status: 400}
            );
        }

        return NextResponse.json({
            success: true,
            data: await updatePolicy(parsed.data),
            message: "Đã lưu cấu hình",
        });
    } catch (error) {
        console.error("Error updating settings:", error);
        return NextResponse.json({success: false, error: "Không thể lưu cấu hình"}, {status: 500});
    }
});

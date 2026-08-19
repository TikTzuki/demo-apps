"use client";

import {useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import {apiFetch} from "@/lib/api-client";
import type {AttendancePolicy} from "@/lib/attendance/compute";

type TimeField = "shiftStartTime" | "lateAfterTime" | "otStartTime" | "overnightStartTime" | "breakStartTime";
type NumberField = "standardShiftMinutes" | "breakMinutes" | "otMinMinutes" | "maxSessionHours" | "dayCutoffHour";

const TIME_FIELDS: {key: TimeField; label: string; hint: string}[] = [
    {key: "shiftStartTime", label: "Giờ bắt đầu ca", hint: "Giờ vào ca tiêu chuẩn buổi sáng."},
    {key: "lateAfterTime", label: "Đi muộn sau", hint: "Check-in sau giờ này bị đánh dấu đi muộn."},
    {key: "otStartTime", label: "OT tính từ", hint: "Mọi phút làm sau giờ này đều tính là OT."},
    {key: "overnightStartTime", label: "Ca đêm từ", hint: "Check-in sau giờ này được coi là ca đêm."},
    {key: "breakStartTime", label: "Bắt đầu nghỉ trưa", hint: "Mốc bắt đầu trừ giờ nghỉ."},
];

const NUMBER_FIELDS: {key: NumberField; label: string; hint: string; min: number; max: number}[] = [
    {key: "standardShiftMinutes", label: "Ca chuẩn (phút)", hint: "Giờ thường tối đa mỗi ngày. 480 = 8 giờ.", min: 60, max: 1440},
    {key: "breakMinutes", label: "Nghỉ trưa (phút)", hint: "Trừ khỏi giờ thường nếu ca làm đi qua giờ nghỉ.", min: 0, max: 240},
    {key: "otMinMinutes", label: "OT tối thiểu (phút)", hint: "OT ngắn hơn mức này không được tính.", min: 0, max: 240},
    {key: "maxSessionHours", label: "Phiên tối đa (giờ)", hint: "Quá mức này coi là quên check-out.", min: 1, max: 48},
    {key: "dayCutoffHour", label: "Mốc sang ngày mới (giờ)", hint: "Ca đêm kết thúc trước giờ này vẫn thuộc ngày hôm trước.", min: 0, max: 12},
];

export default function AdminSettingsPage() {
    const [policy, setPolicy] = useState<AttendancePolicy | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        apiFetch<AttendancePolicy>("/api/admin/settings").then((result) => {
            if (result.success && result.data) setPolicy(result.data);
            else setError(result.error ?? "Không thể tải cấu hình");
        });
    }, []);

    const handleSave = async () => {
        if (!policy) return;
        setIsSaving(true);
        setNotice(null);

        const result = await apiFetch<AttendancePolicy>("/api/admin/settings", {method: "PATCH", json: policy});
        setIsSaving(false);

        if (!result.success || !result.data) {
            setError(result.error ?? "Không thể lưu");
            return;
        }
        setError(null);
        setNotice(result.message ?? "Đã lưu");
        setPolicy(result.data);
    };

    if (!policy) {
        return <p className="text-gray-500">{error ?? "Đang tải..."}</p>;
    }

    return (
        <div className="space-y-4 max-w-3xl">
            <div>
                <h1 className="text-xl font-bold text-gray-800">Cấu hình chấm công</h1>
                <p className="text-gray-500 text-sm">
                    Áp dụng cho mọi tính toán giờ làm và OT, kể cả dữ liệu đã ghi nhận trước đó.
                </p>
            </div>

            {error && <div className="bg-danger/10 text-danger rounded-xl p-3 text-sm">{error}</div>}
            {notice && <div className="bg-success/10 text-success rounded-xl p-3 text-sm">{notice}</div>}

            <div className="bg-white rounded-2xl p-4 shadow-sm grid sm:grid-cols-2 gap-4">
                {TIME_FIELDS.map(({key, label, hint}) => (
                    <label key={key} className="block">
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                        <input
                            type="time"
                            value={policy[key]}
                            onChange={(e) => setPolicy({...policy, [key]: e.target.value})}
                            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-primary focus:outline-none"
                        />
                        <span className="text-gray-400 text-xs">{hint}</span>
                    </label>
                ))}

                {NUMBER_FIELDS.map(({key, label, hint, min, max}) => (
                    <label key={key} className="block">
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                        <input
                            type="number"
                            min={min}
                            max={max}
                            value={policy[key]}
                            onChange={(e) => setPolicy({...policy, [key]: Number(e.target.value)})}
                            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-primary focus:outline-none"
                        />
                        <span className="text-gray-400 text-xs">{hint}</span>
                    </label>
                ))}

                <label className="block">
                    <span className="text-sm font-medium text-gray-700">Chênh lệch múi giờ (phút)</span>
                    <input
                        type="number"
                        min={-720}
                        max={840}
                        value={policy.timezoneOffsetMinutes}
                        onChange={(e) => setPolicy({...policy, timezoneOffsetMinutes: Number(e.target.value)})}
                        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-primary focus:outline-none"
                    />
                    <span className="text-gray-400 text-xs">420 = UTC+7 (giờ Việt Nam).</span>
                </label>
            </div>

            <Button variant="primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Đang lưu..." : "Lưu cấu hình"}
            </Button>
        </div>
    );
}

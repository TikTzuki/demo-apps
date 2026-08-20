"use client";

import {useEffect, useState} from "react";
import {Alert, Button, inputClass, Panel, PanelHead, Tag} from "@/components/admin/Ui";
import {formatDuration} from "@/lib/attendance/time";
import {PolicyGuide} from "@/components/admin/PolicyGuide";
import {apiFetch} from "@/lib/api-client";
import {type AttendancePolicy, DEFAULT_POLICY} from "@/lib/attendance/compute";

type TimeField = "shiftStartTime" | "lateAfterTime" | "otStartTime" | "overnightStartTime" | "breakStartTime";
type NumberField = "standardShiftMinutes" | "breakMinutes" | "otMinMinutes" | "maxSessionHours" | "dayCutoffHour";

const TIME_FIELDS: {key: TimeField; label: string; hint: string}[] = [
    {key: "shiftStartTime", label: "Giờ bắt đầu ca", hint: "Giờ vào ca tiêu chuẩn buổi sáng."},
    {key: "lateAfterTime", label: "Đi muộn sau", hint: "Check-in sau giờ này bị đánh dấu đi muộn."},
    {key: "otStartTime", label: "OT tính từ", hint: "Mọi phút làm sau giờ này đều tính là OT."},
    {
        key: "overnightStartTime",
        label: "Ca đêm từ",
        hint: "Người đã check-out được vào ca lần nữa sau giờ này. Không đổi mức OT."
    },
    {key: "breakStartTime", label: "Bắt đầu nghỉ trưa", hint: "Mốc bắt đầu trừ giờ nghỉ."},
];

const NUMBER_FIELDS: {key: NumberField; label: string; hint: string; min: number; max: number}[] = [
    {key: "standardShiftMinutes", label: "Ca chuẩn (phút)", hint: "Giờ thường tối đa mỗi ngày. 480 = 8 giờ.", min: 60, max: 1440},
    {key: "breakMinutes", label: "Nghỉ trưa (phút)", hint: "Trừ khỏi giờ thường nếu ca làm đi qua giờ nghỉ.", min: 0, max: 240},
    {key: "otMinMinutes", label: "OT tối thiểu (phút)", hint: "OT ngắn hơn mức này không được tính.", min: 0, max: 240},
    {key: "maxSessionHours", label: "Phiên tối đa (giờ)", hint: "Quá mức này coi là quên check-out.", min: 1, max: 48},
    {
        key: "dayCutoffHour",
        label: "Ngày công kết thúc (giờ)",
        hint: "Phiên dừng tính công ở mốc này. 0 = nửa đêm, nên OT tối đa là 18:00→24:00.",
        min: 0,
        max: 12
    },
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

    // Resetting is deliberate and consequential — every past day recomputes.
    const handleReset = async () => {
        if (!window.confirm(
            "Khôi phục toàn bộ cấu hình về mặc định?\n\n" +
            "Giờ làm và OT của MỌI ngày công đã ghi nhận sẽ được tính lại theo mốc mặc định."
        )) return;

        setIsSaving(true);
        setNotice(null);
        const result = await apiFetch<AttendancePolicy>("/api/admin/settings", {
            method: "PATCH",
            json: DEFAULT_POLICY,
        });
        setIsSaving(false);

        if (!result.success || !result.data) {
            setError(result.error ?? "Không thể khôi phục");
            return;
        }
        setError(null);
        setNotice("Đã khôi phục cấu hình mặc định");
        setPolicy(result.data);
    };

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
        return <p className="text-zinc-500">{error ?? "Đang tải..."}</p>;
    }

    // Worked examples recomputed from whatever is on screen, so the consequence
    // of a threshold change is visible before it is saved.
    const otBoundary = Number(policy.otStartTime.slice(0, 2)) * 60 + Number(policy.otStartTime.slice(3));
    const shiftStart = Number(policy.shiftStartTime.slice(0, 2)) * 60 + Number(policy.shiftStartTime.slice(3));
    const cap = policy.standardShiftMinutes;
    const examples = [
        {shift: `${policy.shiftStartTime} → ${policy.otStartTime}`, regular: Math.min(cap, otBoundary - shiftStart - policy.breakMinutes), ot: 0, overnight: 0},
        {shift: `${policy.shiftStartTime} → 22:00`, regular: Math.min(cap, otBoundary - shiftStart - policy.breakMinutes), ot: 22 * 60 - otBoundary, overnight: 0},
        {shift: `${policy.shiftStartTime} → 18:30, quay lại 22:00 → 02:00`, regular: Math.min(cap, otBoundary - shiftStart - policy.breakMinutes), ot: 30 + 240, overnight: 240},
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col lg:flex-row gap-5 items-start">
                <div className="flex-1 flex flex-col gap-4 min-w-0">
            <div>
                <h1 className="text-2xl font-bold">Cấu hình chấm công</h1>
                <p className="text-zinc-500 text-sm">
                    Áp dụng cho mọi tính toán giờ làm và OT, kể cả dữ liệu đã ghi nhận trước đó.
                </p>
            </div>

            {error && <Alert tone="danger">{error}</Alert>}
            {notice && <Alert tone="success">{notice}</Alert>}

            <div className="bg-white border border-zinc-200 rounded-xl p-5 grid sm:grid-cols-2 gap-4">
                {TIME_FIELDS.map(({key, label, hint}) => (
                    <label key={key} className="block">
                        <span className="text-sm font-medium text-zinc-800">{label}</span>
                        <input
                            type="time"
                            value={policy[key]}
                            onChange={(e) => setPolicy({...policy, [key]: e.target.value})}
                            className={`${inputClass} mt-1 w-full font-mono`}
                        />
                        <span className="text-xs text-zinc-400">{hint}</span>
                    </label>
                ))}

                {NUMBER_FIELDS.map(({key, label, hint, min, max}) => (
                    <label key={key} className="block">
                        <span className="text-sm font-medium text-zinc-800">{label}</span>
                        <input
                            type="number"
                            min={min}
                            max={max}
                            value={policy[key]}
                            onChange={(e) => setPolicy({...policy, [key]: Number(e.target.value)})}
                            className={`${inputClass} mt-1 w-full font-mono`}
                        />
                        <span className="text-xs text-zinc-400">{hint}</span>
                    </label>
                ))}

                <label className="block">
                    <span className="text-sm font-medium text-zinc-800">Chênh lệch múi giờ (phút)</span>
                    <input
                        type="number"
                        min={-720}
                        max={840}
                        value={policy.timezoneOffsetMinutes}
                        onChange={(e) => setPolicy({...policy, timezoneOffsetMinutes: Number(e.target.value)})}
                        className={`${inputClass} mt-1 w-full font-mono`}
                    />
                    <span className="text-xs text-zinc-400">420 = UTC+7 (giờ Việt Nam).</span>
                </label>
            </div>

            <div className="flex gap-2">
                <Button variant="primary" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Đang lưu..." : "Lưu cấu hình"}
                </Button>
                <Button onClick={handleReset} disabled={isSaving}>Khôi phục mặc định</Button>
            </div>
                </div>

                <aside className="w-[340px] shrink-0 flex flex-col gap-4">
                    <Panel>
                        <PanelHead>Với cấu hình này</PanelHead>
                        <div className="p-4 flex flex-col gap-3">
                            {examples.map((ex) => (
                                <div key={ex.shift} className="flex flex-col gap-2 pb-3 border-b border-zinc-100 last:border-0 last:pb-0">
                                    <span className="font-mono text-xs text-zinc-600">{ex.shift}</span>
                                    <span className="flex flex-wrap gap-1.5">
                                        <Tag>{formatDuration(ex.regular)} thường</Tag>
                                        {ex.ot > 0
                                            ? <Tag tone="ot">{formatDuration(ex.ot)} OT</Tag>
                                            : <Tag>không OT</Tag>}
                                        {ex.overnight > 0 && <Tag tone="overnight">{formatDuration(ex.overnight)} qua đêm</Tag>}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Panel>

                </aside>
            </div>

            <PolicyGuide policy={policy}/>
        </div>
    );
}

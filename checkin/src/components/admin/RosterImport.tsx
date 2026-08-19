"use client";

import {useRef, useState} from "react";
import {FileSpreadsheet, Upload} from "lucide-react";
import {Button} from "@/components/ui/button";
import {cn} from "@/lib/utils";
import type {RosterResult} from "@/lib/roster/import";

interface RosterImportProps {
    onImported: () => void;
}

const ACTION_STYLE = {
    created: "text-success",
    updated: "text-primary",
    unchanged: "text-gray-400",
} as const;

const ACTION_LABEL = {created: "Thêm mới", updated: "Cập nhật", unchanged: "Không đổi"} as const;

/**
 * Upload an HR export to create/update employees in bulk.
 *
 * Always previews first: the admin sees the exact diff before anything is written,
 * because a wrong column mapping would otherwise reshuffle every department silently.
 */
export function RosterImport({onImported}: RosterImportProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<RosterResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [isBusy, setIsBusy] = useState(false);

    const send = async (chosen: File, dryRun: boolean) => {
        setIsBusy(true);
        setError(null);

        const body = new FormData();
        body.append("file", chosen);
        body.append("dryRun", String(dryRun));

        try {
            const response = await fetch("/api/admin/members/import", {method: "POST", body});
            const payload = await response.json();

            if (!payload.success) {
                setError(payload.error ?? "Không thể nhập danh sách");
                setPreview(payload.data?.issues ? {issues: payload.data.issues} as RosterResult : null);
                return;
            }

            if (dryRun) {
                setPreview(payload.data);
                setNotice(null);
            } else {
                setPreview(null);
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
                setNotice(payload.message ?? "Đã nhập danh sách");
                onImported();
            }
        } catch {
            setError("Mất kết nối tới máy chủ");
        } finally {
            setIsBusy(false);
        }
    };

    const handleChoose = (chosen: File | null) => {
        setFile(chosen);
        setPreview(null);
        setNotice(null);
        setError(null);
        if (chosen) send(chosen, true);
    };

    return (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
                <FileSpreadsheet size={18} className="text-primary"/>
                <h2 className="font-semibold text-gray-800">Nhập danh sách nhân viên</h2>
            </div>
            <p className="text-gray-500 text-sm mb-3">
                Tệp .xlsx, .xls hoặc .csv có các cột <strong>Mã NV</strong>, <strong>Họ tên</strong>,{" "}
                <strong>Phòng ban</strong> và <strong>Email</strong> (không bắt buộc).
                Khớp theo mã nhân viên: người đã có sẽ được cập nhật, người mới được thêm,
                người không có trong tệp giữ nguyên.{" "}
                <a href="/mau-danh-sach-nhan-vien.csv" download className="text-primary underline">Tải tệp mẫu</a>
            </p>

            <div className="flex flex-wrap items-center gap-2">
                <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => handleChoose(e.target.files?.[0] ?? null)}
                    className="text-sm text-gray-600 file:mr-3 file:rounded-full file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200"
                />
                {preview && preview.changes && (
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => file && send(file, false)}
                        disabled={isBusy || preview.created + preview.updated === 0}
                    >
                        <Upload size={15} className="mr-1.5"/>
                        Áp dụng {preview.created + preview.updated} thay đổi
                    </Button>
                )}
            </div>

            {isBusy && <p className="text-gray-400 text-sm mt-3">Đang xử lý...</p>}
            {error && <div className="bg-danger/10 text-danger rounded-xl p-3 mt-3 text-sm">{error}</div>}
            {notice && <div className="bg-success/10 text-success rounded-xl p-3 mt-3 text-sm">{notice}</div>}

            {preview?.issues && preview.issues.length > 0 && (
                <div className="bg-warning/10 rounded-xl p-3 mt-3">
                    <p className="text-warning font-medium text-sm mb-1">
                        {preview.issues.length} dòng bị bỏ qua
                    </p>
                    <ul className="text-warning/90 text-xs space-y-0.5 max-h-32 overflow-y-auto">
                        {preview.issues.map((issue, i) => (
                            <li key={i}>
                                {issue.rowNumber > 0 ? `Dòng ${issue.rowNumber}: ` : ""}{issue.message}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {preview?.changes && (
                <div className="mt-3">
                    <p className="text-gray-600 text-sm mb-2">
                        Xem trước — chưa ghi gì:{" "}
                        <strong className="text-success">{preview.created} thêm mới</strong>,{" "}
                        <strong className="text-primary">{preview.updated} cập nhật</strong>,{" "}
                        {preview.unchanged} không đổi
                        {preview.teamsCreated.length > 0 && (
                            <> · phòng ban mới: <strong>{preview.teamsCreated.join(", ")}</strong></>
                        )}
                    </p>

                    <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-xl">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-500 text-left sticky top-0">
                            <tr>
                                <th className="px-3 py-1.5 font-medium">Dòng</th>
                                <th className="px-3 py-1.5 font-medium">Mã NV</th>
                                <th className="px-3 py-1.5 font-medium">Họ tên</th>
                                <th className="px-3 py-1.5 font-medium">Phòng ban</th>
                                <th className="px-3 py-1.5 font-medium">Thay đổi</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {preview.changes.map((change) => (
                                <tr key={change.rowNumber} className={cn(change.action === "unchanged" && "text-gray-400")}>
                                    <td className="px-3 py-1.5">{change.rowNumber}</td>
                                    <td className="px-3 py-1.5">{change.employeeCode}</td>
                                    <td className="px-3 py-1.5">{change.name}</td>
                                    <td className="px-3 py-1.5">{change.teamName}</td>
                                    <td className={cn("px-3 py-1.5 font-medium", ACTION_STYLE[change.action])}>
                                        {ACTION_LABEL[change.action]}
                                        {change.changes.length > 0 && ` (${change.changes.join(", ")})`}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

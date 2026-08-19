"use client";

import {useCallback, useEffect, useState} from "react";
import type {AttendanceBoard} from "@/lib/types";

const REFRESH_MS = 5000;

/** Polls the live attendance board so a wall-mounted kiosk stays current. */
export function useBoard() {
    const [board, setBoard] = useState<AttendanceBoard | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        try {
            const response = await fetch("/api/attendance/today");
            const payload = await response.json();
            if (payload.success) {
                setBoard(payload.data);
                setError(null);
            } else {
                setError(payload.error ?? "Không thể tải dữ liệu");
            }
        } catch {
            setError("Mất kết nối tới máy chủ");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, REFRESH_MS);
        return () => clearInterval(interval);
    }, [refresh]);

    return {board, isLoading, error, refresh};
}

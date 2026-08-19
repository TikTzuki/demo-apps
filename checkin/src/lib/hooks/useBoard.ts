"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import type {AttendanceBoard} from "@/lib/types";

const REFRESH_MS = 5000;
/** Three missed polls. Below this, a slow network would flag a healthy kiosk. */
const STALE_AFTER_MS = 16_000;

/**
 * Polls the live attendance board so a wall-mounted kiosk stays current.
 *
 * Also reports whether the data is actually fresh. A frozen kiosk renders
 * exactly like a working one, so something on screen has to be able to say
 * "these numbers stopped moving" — see SecondsRing.
 */
export function useBoard() {
    const [board, setBoard] = useState<AttendanceBoard | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isStale, setIsStale] = useState(false);
    const lastSuccessAt = useRef<number>(Date.now());

    const refresh = useCallback(async () => {
        try {
            const response = await fetch("/api/attendance/today");
            const payload = await response.json();
            if (payload.success) {
                setBoard(payload.data);
                setError(null);
                lastSuccessAt.current = Date.now();
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
        const poll = setInterval(refresh, REFRESH_MS);

        // A separate heartbeat: when the fetch is failing, `refresh` may settle
        // without changing any state, so staleness needs its own timer to be
        // noticed at all.
        const heartbeat = setInterval(() => {
            setIsStale(Date.now() - lastSuccessAt.current > STALE_AFTER_MS);
        }, REFRESH_MS);

        return () => {
            clearInterval(poll);
            clearInterval(heartbeat);
        };
    }, [refresh]);

    return {board, isLoading, error, isStale, refresh};
}

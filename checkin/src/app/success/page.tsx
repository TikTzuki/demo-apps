"use client";

import {Suspense, useEffect} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {LogIn, LogOut, Moon} from "lucide-react";
import {formatDuration} from "@/lib/attendance/time";
import {cn} from "@/lib/utils";
import {ActionBurst} from "@/components/kiosk/ActionBurst";
import type {AttendanceAction} from "@/components/attendance/ActionModal";

const AUTO_RETURN_MS = 4000;

/**
 * The one screen everybody sees twice a day.
 *
 * Colour carries the message before any text is read: green means you are on
 * the clock, amber means you are off it and here is your overtime, indigo means
 * a night shift just started.
 */
function SuccessContent() {
    const router = useRouter();
    const params = useSearchParams();

    const name = params.get("name") || "Bạn";
    const team = params.get("team") || "";
    const isCheckOut = params.get("action") === "CHECK_OUT";
    const isOvernight = params.get("kind") === "OVERNIGHT";
    const at = params.get("at");
    const worked = Number(params.get("worked") ?? 0);
    const ot = Number(params.get("ot") ?? 0);

    // A wall tablet must return to the picker by itself — nobody presses Back.
    useEffect(() => {
        const id = setTimeout(() => router.push("/"), AUTO_RETURN_MS);
        return () => clearTimeout(id);
    }, [router]);

    const burstAction: AttendanceAction =
        isCheckOut ? "CHECK_OUT" : isOvernight ? "CHECK_IN_OVERNIGHT" : "CHECK_IN";

    const theme = isCheckOut
        ? {accent: "bg-checkout", text: "text-checkout", border: "border-checkout", label: "Đã ra ca", Icon: LogOut}
        : isOvernight
            ? {accent: "bg-overnight", text: "text-overnight", border: "border-overnight", label: "Đã vào ca đêm", Icon: Moon}
            : {accent: "bg-checkin", text: "text-checkin", border: "border-checkin", label: "Đã vào ca", Icon: LogIn};

    const timeLabel = at ? new Date(at).toLocaleTimeString("vi-VN", {hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh"}) : "";

    return (
        <div className="relative min-h-screen overflow-hidden flex flex-col">
            <ActionBurst action={burstAction}/>

            <div className="relative flex-1 flex flex-col justify-center gap-9 px-8 sm:px-16 py-12">

                <div className="burst-slam flex items-center gap-7">
                    <span className={cn("grid h-24 w-24 sm:h-28 sm:w-28 place-items-center rounded-2xl shrink-0", theme.accent)}>
                        <theme.Icon size={54} className="text-ink" strokeWidth={2.5}/>
                    </span>
                    <div className="flex flex-col gap-2 min-w-0">
                        <span className={cn("text-base sm:text-lg font-semibold uppercase tracking-[0.09em]", theme.text)}>
                            {theme.label}
                        </span>
                        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-none truncate">
                            {name.split("(")[0].trim()}
                        </h1>
                        {team && <p className="text-lg text-zinc-500">{team}</p>}
                    </div>
                </div>

                <div className="burst-rise h-px bg-ink-line"/>

                {isCheckOut ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Stat label="Giờ ra" value={timeLabel} delay="0.34s"/>
                        <Stat label="Tổng giờ làm" value={formatDuration(worked)} delay="0.39s"/>
                        <Stat label="Giờ thường" value={formatDuration(Math.max(0, worked - ot))} delay="0.44s"/>
                        <Stat
                            label="Giờ OT"
                            value={ot > 0 ? formatDuration(ot) : "0"}
                            highlight={ot > 0}
                        />
                    </div>
                ) : (
                    <div className="burst-rise grid grid-cols-2 gap-4 max-w-lg">
                        <Stat label="Giờ vào ca" value={timeLabel}/>
                        <Stat label="Hôm nay đã làm" value={formatDuration(worked)}/>
                    </div>
                )}

                {isCheckOut && ot > 0 && (
                    <div className={cn("burst-rise flex items-center gap-3 rounded-xl bg-ink-raised px-5 py-4 border-l-4", theme.border)}>
                        <span className="text-base text-zinc-300">
                            Hôm nay bạn làm thêm <strong className={theme.text}>{formatDuration(ot)}</strong>.
                        </span>
                    </div>
                )}
            </div>

            <div className="relative px-8 sm:px-16 pb-9 flex items-center gap-4">
                <div className="flex-1 h-1.5 rounded-full bg-ink-line overflow-hidden">
                    <div className={cn("h-1.5 rounded-full animate-sweep", theme.accent)}/>
                </div>
                <span className="text-sm text-zinc-600 whitespace-nowrap">Tự quay lại</span>
            </div>
        </div>
    );
}

function Stat({label, value, highlight, delay}: {
    label: string; value: string; highlight?: boolean; delay?: string;
}) {
    return (
        <div
            style={delay ? {animationDelay: delay} : undefined}
            className={cn(
                "rounded-xl border-2 px-6 py-5 flex flex-col gap-2.5",
                highlight ? "burst-payoff border-checkout bg-[#1f1608]" : "burst-rise border-ink-line bg-ink-raised"
            )}>
            <span className={cn("text-sm uppercase tracking-wider", highlight ? "text-checkout" : "text-zinc-500")}>
                {label}
            </span>
            <span className={cn("tabular text-3xl sm:text-4xl font-bold leading-none", highlight && "text-checkout")}>
                {value}
            </span>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen"/>}>
            <SuccessContent/>
        </Suspense>
    );
}

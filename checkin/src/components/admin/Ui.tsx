"use client";

import {cn} from "@/lib/utils";

/** Shared admin primitives — one place for the density and colour decisions. */

export function Panel({children, className}: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("bg-white border border-zinc-200 rounded-xl overflow-hidden", className)}>
            {children}
        </div>
    );
}

export function PanelHead({children}: { children: React.ReactNode }) {
    return (
        <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 text-sm font-semibold text-zinc-900">
            {children}
        </div>
    );
}

export function Field({label, hint, children}: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</span>
            {children}
            {hint && <span className="text-xs text-zinc-400 leading-snug">{hint}</span>}
        </label>
    );
}

// h-10 matches Button, so a control and its button line up on the same row.
export const inputClass =
    "h-10 px-3 border border-zinc-300 rounded-lg bg-white text-sm text-zinc-900 " +
    "focus:border-zinc-900 focus:outline-none placeholder:text-zinc-400";

export function Button({
                           variant = "secondary", className, ...props
                       }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "danger" | "warning";
}) {
    return (
        <button
            {...props}
            className={cn(
                "inline-flex items-center justify-center gap-2 whitespace-nowrap",
                "h-10 px-4 rounded-lg text-sm font-semibold transition-colors",
                "disabled:opacity-50 disabled:pointer-events-none",
                variant === "primary" && "bg-ink text-zinc-50 hover:bg-zinc-800",
                variant === "secondary" && "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 font-medium",
                variant === "danger" && "bg-red-700 text-white hover:bg-red-800",
                variant === "warning" && "bg-amber-600 text-white hover:bg-amber-700",
                className
            )}
        />
    );
}

/** Colour marks exceptions only — never decoration. */
const TAG_TONES = {
    working: "bg-emerald-100 text-emerald-800",
    ot: "bg-amber-100 text-amber-800",
    overnight: "bg-indigo-100 text-indigo-800",
    danger: "bg-red-100 text-red-800",
    neutral: "bg-zinc-100 text-zinc-600",
} as const;

export function Tag({tone = "neutral", children}: { tone?: keyof typeof TAG_TONES; children: React.ReactNode }) {
    return (
        <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap", TAG_TONES[tone])}>
            {children}
        </span>
    );
}

export function Alert({
                          tone, title, children,
                      }: { tone: "danger" | "warning" | "success" | "info"; title?: string; children?: React.ReactNode }) {
    const tones = {
        danger: "bg-red-50 border-red-200 text-red-800",
        warning: "bg-amber-50 border-amber-200 text-amber-800",
        success: "bg-emerald-50 border-emerald-200 text-emerald-800",
        info: "bg-zinc-50 border-zinc-200 text-zinc-600",
    };
    return (
        <div className={cn("rounded-lg border px-4 py-3 text-sm", tones[tone])}>
            {title && <p className="font-semibold mb-0.5">{title}</p>}
            {children}
        </div>
    );
}

/** Empty state that says why it is empty and what to do next. */
export function EmptyState({
                               icon, title, body, action,
                           }: { icon: React.ReactNode; title: string; body: string; action?: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 px-8 py-16 text-center">
            <div className="grid h-13 w-13 place-items-center rounded-xl bg-zinc-100 p-3 text-zinc-400">{icon}</div>
            <p className="text-base font-semibold text-zinc-900">{title}</p>
            <p className="max-w-sm text-sm leading-relaxed text-zinc-500">{body}</p>
            {action && <div className="mt-1 flex gap-2">{action}</div>}
        </div>
    );
}

/** Table skeleton — the tables poll, so a text swap would flicker the page. */
export function TableSkeleton({rows = 8, cols = 6}: { rows?: number; cols?: number }) {
    return (
        <div className="flex flex-col gap-3 p-4">
            {Array.from({length: rows}).map((_, r) => (
                <div key={r} className="flex items-center gap-4">
                    {Array.from({length: cols}).map((_, c) => (
                        <div
                            key={c}
                            className={cn("h-2.5 rounded-full", c === 1 ? "bg-zinc-200" : "bg-zinc-100")}
                            style={{width: `${[80, 150, 110, 60, 55, 70][c % 6]}px`}}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

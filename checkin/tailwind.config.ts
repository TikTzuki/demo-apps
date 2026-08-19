import type {Config} from "tailwindcss";

const config: Config = {
    content: [
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ["var(--font-archivo)", "ui-sans-serif", "system-ui", "sans-serif"],
                mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
            },
            colors: {
                // Kiosk surfaces — near-black so the wall display reads at distance.
                ink: {
                    DEFAULT: "#0c0c0e",
                    raised: "#18181b",
                    sunken: "#141416",
                    line: "#27272a",
                    edge: "#3f3f46",
                },
                // The two actions people take. Never the same colour.
                checkin: "#10b981",
                checkout: "#f59e0b",
                overnight: "#6366f1",
                danger: "#ef4444",
            },
            animation: {
                "flash-in": "flashIn 0.45s ease-out",
                "rise": "rise 0.35s ease-out both",
                "sweep": "sweep 3s linear forwards",
                "pulse-dot": "pulseDot 2s ease-in-out infinite",
            },
            keyframes: {
                flashIn: {
                    "0%": {opacity: "0", transform: "scale(0.94)"},
                    "60%": {transform: "scale(1.02)"},
                    "100%": {opacity: "1", transform: "scale(1)"},
                },
                rise: {
                    "0%": {opacity: "0", transform: "translateY(10px)"},
                    "100%": {opacity: "1", transform: "translateY(0)"},
                },
                sweep: {
                    "0%": {width: "100%"},
                    "100%": {width: "0%"},
                },
                pulseDot: {
                    "0%, 100%": {opacity: "1"},
                    "50%": {opacity: "0.45"},
                },
            },
        },
    },
    plugins: [],
};

export default config;

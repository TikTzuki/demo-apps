import type {Config} from "tailwindcss";

const config: Config = {
    content: [
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#6366F1",
                success: "#22C55E",
                warning: "#F59E0B",
                danger: "#EF4444",
            },
            animation: {
                float: "float 3s ease-in-out infinite",
                blink: "blink 4s ease-in-out infinite",
                "bounce-in": "bounceIn 0.5s ease-out",
            },
            keyframes: {
                float: {
                    "0%, 100%": {transform: "translateY(0px)"},
                    "50%": {transform: "translateY(-15px)"},
                },
                blink: {
                    "0%, 45%, 55%, 100%": {transform: "scaleY(1)"},
                    "50%": {transform: "scaleY(0.1)"},
                },
                bounceIn: {
                    "0%": {transform: "scale(0)", opacity: "0"},
                    "50%": {transform: "scale(1.1)"},
                    "100%": {transform: "scale(1)", opacity: "1"},
                },
            },
        },
    },
    plugins: [],
};

export default config;

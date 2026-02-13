"use client";

import {createContext, useContext, useEffect, useState} from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: "system",
    setTheme: () => {
    },
    resolvedTheme: "light",
});

function getSystemTheme(): "light" | "dark" {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

function applyTheme(resolved: "light" | "dark") {
    if (resolved === "dark") {
        document.documentElement.classList.add("dark");
    } else {
        document.documentElement.classList.remove("dark");
    }
}

export function ThemeProvider({children}: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("system");
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

    useEffect(() => {
        const stored = localStorage.getItem("theme") as Theme | null;
        if (stored === "light" || stored === "dark" || stored === "system") {
            setThemeState(stored);
        }
    }, []);

    useEffect(() => {
        const resolved = theme === "system" ? getSystemTheme() : theme;
        setResolvedTheme(resolved);
        applyTheme(resolved);
    }, [theme]);

    useEffect(() => {
        if (theme !== "system") return;

        const mql = window.matchMedia("(prefers-color-scheme: dark)");

        function handler() {
            const resolved = getSystemTheme();
            setResolvedTheme(resolved);
            applyTheme(resolved);
        }

        mql.addEventListener("change", handler);
        return () => mql.removeEventListener("change", handler);
    }, [theme]);

    function setTheme(next: Theme) {
        setThemeState(next);
        localStorage.setItem("theme", next);
    }

    return (
        <ThemeContext.Provider value={{theme, setTheme, resolvedTheme}}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}

"use client";

import {useTheme} from "@/lib/theme-context";
import {Moon, Sun, Monitor} from "lucide-react";

export function ThemeToggle() {
    const {theme, setTheme} = useTheme();

    function cycle() {
        const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
        setTheme(next);
    }

    return (
        <button
            onClick={cycle}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            title={`Theme: ${theme}`}
        >
            {theme === "light" && <Sun className="h-4 w-4"/>}
            {theme === "dark" && <Moon className="h-4 w-4"/>}
            {theme === "system" && <Monitor className="h-4 w-4"/>}
        </button>
    );
}

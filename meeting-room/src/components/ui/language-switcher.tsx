"use client";

import {useTranslation} from "@/lib/i18n/context";
import {locales} from "@/lib/i18n";
import {Globe} from "lucide-react";

export function LanguageSwitcher() {
    const {locale, setLocale} = useTranslation();

    function toggle() {
        const currentIdx = locales.findIndex((l) => l.code === locale);
        const nextIdx = (currentIdx + 1) % locales.length;
        setLocale(locales[nextIdx].code);
    }

    const current = locales.find((l) => l.code === locale);

    return (
        <button
            onClick={toggle}
            className="flex h-9 items-center gap-1 rounded-full bg-gray-100 px-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            title={`Language: ${current?.label}`}
        >
            <Globe className="h-3.5 w-3.5"/>
            <span>{current?.label}</span>
        </button>
    );
}

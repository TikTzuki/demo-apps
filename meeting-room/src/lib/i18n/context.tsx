"use client";

import {createContext, useCallback, useContext, useEffect, useState} from "react";
import type {Locale, TranslationKey, Translations} from "./index";
import {defaultLocale, dictionaries} from "./index";

interface I18nContextValue {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
    tArray: (key: TranslationKey) => readonly string[];
}

const I18nContext = createContext<I18nContextValue>({
    locale: defaultLocale,
    setLocale: () => {
    },
    t: (key) => String(key),
    tArray: () => [],
});

export function I18nProvider({children}: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(defaultLocale);

    useEffect(() => {
        const stored = localStorage.getItem("locale") as Locale | null;
        if (stored === "en" || stored === "vi") {
            setLocaleState(stored);
            document.documentElement.lang = stored;
        }
    }, []);

    function setLocale(next: Locale) {
        setLocaleState(next);
        localStorage.setItem("locale", next);
        document.documentElement.lang = next;
    }

    const dict: Translations = dictionaries[locale];

    const t = useCallback(
        (key: TranslationKey, vars?: Record<string, string | number>): string => {
            const raw = dict[key];
            if (Array.isArray(raw)) return raw.join(", ");
            let result = raw as string;
            if (vars) {
                for (const [k, v] of Object.entries(vars)) {
                    result = result.replaceAll(`{{${k}}}`, String(v));
                }
            }
            return result;
        },
        [dict],
    );

    const tArray = useCallback(
        (key: TranslationKey): readonly string[] => {
            const raw = dict[key];
            if (Array.isArray(raw)) return raw;
            return [raw as string];
        },
        [dict],
    );

    return (
        <I18nContext.Provider value={{locale, setLocale, t, tArray}}>
            {children}
        </I18nContext.Provider>
    );
}

export function useTranslation() {
    return useContext(I18nContext);
}

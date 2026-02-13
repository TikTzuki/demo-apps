import {en} from "./en";
import {vi} from "./vi";

type TranslationValue = string | readonly string[];

export type Translations = {
    [K in keyof typeof en]: TranslationValue;
};
export type TranslationKey = keyof typeof en;
export type Locale = "en" | "vi";

export const locales: ReadonlyArray<{ code: Locale; label: string }> = [
    {code: "en", label: "EN"},
    {code: "vi", label: "VI"},
];

export const dictionaries: Record<Locale, Translations> = {en, vi};

export const defaultLocale: Locale = "vi";

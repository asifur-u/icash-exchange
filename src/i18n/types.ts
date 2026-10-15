export type Locale = "en" | "bn";

export const LOCALES: Locale[] = ["en", "bn"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "icash_locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "bn";
}

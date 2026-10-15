"use client";

import { useLocale } from "@/i18n/provider";
import type { Locale } from "@/i18n/types";
import { cn } from "@/lib/cn";

export function LanguageSwitcher({
  className,
  tone = "dark",
}: {
  className?: string;
  /** dark = marketing header; light = account portal */
  tone?: "dark" | "light";
}) {
  const { locale, setLocale, t, pending } = useLocale();

  const options: { id: Locale; label: string }[] = [
    { id: "en", label: "EN" },
    { id: "bn", label: "বাং" },
  ];

  return (
    <div
      role="group"
      aria-label={t("common.language")}
      className={cn(
        "inline-flex items-center rounded-full p-0.5 text-xs font-semibold tracking-wide",
        tone === "dark"
          ? "border border-white/20 bg-white/[0.06]"
          : "border border-zinc-200 bg-zinc-50",
        className,
      )}
    >
      {options.map((opt) => {
        const active = locale === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            disabled={pending && !active}
            onClick={() => setLocale(opt.id)}
            aria-pressed={active}
            className={cn(
              "min-w-[2.4rem] rounded-full px-2.5 py-1.5 transition",
              active
                ? tone === "dark"
                  ? "bg-white text-black shadow-sm"
                  : "bg-[#18181b] text-white shadow-sm"
                : tone === "dark"
                  ? "text-white/65 hover:text-white"
                  : "text-zinc-500 hover:text-zinc-900",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

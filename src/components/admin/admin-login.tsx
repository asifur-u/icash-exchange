"use client";

import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useT } from "@/i18n/provider";
import { notifyError } from "@/lib/swal";

export function AdminLogin({ isProd }: { isProd: boolean }) {
  const t = useT();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) {
        await notifyError(t("admin.accessDenied"), data.error?.message ?? t("admin.badPassword"));
        setPending(false);
        return;
      }
      window.location.assign("/admin");
    } catch {
      await notifyError(t("admin.accessDenied"), t("admin.reachFailed"));
      setPending(false);
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#050505] px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(225,29,46,0.28), transparent 55%), radial-gradient(ellipse 40% 40% at 90% 80%, rgba(255,255,255,0.04), transparent 50%)",
        }}
      />

      <div className="relative w-full max-w-[420px]">
        <div className="mb-6 flex justify-end">
          <LanguageSwitcher tone="dark" />
        </div>

        <div className="mb-8 text-center">
          <div className="inline-flex">
            <BrandLogo size="lg" />
          </div>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#e11d2e]">
            {t("admin.loginEyebrow")}
          </p>
          <h1 className="mt-2 text-[clamp(1.75rem,5vw,2.25rem)] font-extrabold tracking-tight text-white">
            {t("admin.loginTitle")}
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/45">
            {isProd ? t("admin.loginLeadProd") : t("admin.loginLeadDev")}
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0c] shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
        >
          <div className="h-px bg-gradient-to-r from-transparent via-[#e11d2e] to-transparent" />
          <div className="p-6 sm:p-7">
            <label
              htmlFor="admin-password"
              className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40"
            >
              {t("admin.password")}
            </label>
            <div className="relative mt-2">
              <input
                id="admin-password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 w-full rounded-xl border border-white/12 bg-black/50 px-4 pr-20 text-sm text-white outline-none transition focus:border-[#e11d2e]/60 focus:ring-2 focus:ring-[#e11d2e]/20"
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 text-xs font-semibold text-white/45 transition hover:text-white"
              >
                {show ? t("admin.hide") : t("admin.show")}
              </button>
            </div>

            <button
              type="submit"
              disabled={pending || !password}
              className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#e11d2e] text-sm font-semibold text-white shadow-[0_12px_28px_rgba(225,29,46,0.35)] transition hover:bg-[#c41828] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? t("admin.checking") : t("admin.enterDesk")}
            </button>
          </div>
          <div className="border-t border-white/8 bg-white/[0.02] px-6 py-3.5 text-center text-[11px] text-white/35 sm:px-7">
            {t("admin.sessionNote")}
          </div>
        </form>
      </div>
    </div>
  );
}

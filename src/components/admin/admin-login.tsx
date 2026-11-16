"use client";

import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useT } from "@/i18n/provider";
import { notifyError } from "@/lib/swal";

export function AdminLogin({ needsSetup }: { needsSetup: boolean }) {
  const t = useT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("admin-root");
    return () => document.documentElement.classList.remove("admin-root");
  }, []);

  const canSubmit = needsSetup
    ? name.trim().length >= 2 && email.includes("@") && /^01\d{9}$/.test(phone) && password.length >= 8
    : email.includes("@") && password.length > 0;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const response = await fetch(needsSetup ? "/api/admin/setup" : "/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(needsSetup ? { name, email, phone, password } : { email, password }),
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
    <div className="admin-desk relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-black px-4 py-10">
      <div className="relative w-full max-w-[420px]">
        <div className="mb-6 flex justify-end">
          <LanguageSwitcher tone="dark" />
        </div>

        <div className="mb-8 text-center">
          <div className="inline-flex">
            <BrandLogo size="lg" />
          </div>
          <p className="ad-kicker mt-5 text-[11px] font-semibold uppercase tracking-[0.2em]">
            {t("admin.loginEyebrow")}
          </p>
          <h1 className="mt-2 text-[clamp(1.75rem,5vw,2.25rem)] font-extrabold tracking-tight text-[var(--ad-ink)]">
            {needsSetup ? t("admin.setupTitle") : t("admin.loginTitle")}
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[var(--ad-muted)]">
            {needsSetup ? t("admin.setupLead") : t("admin.loginLead")}
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="admin-card"
        >
          <div className="h-px bg-gradient-to-r from-transparent via-[var(--ad-gold)] to-transparent" />
          <div className="space-y-4 p-6 sm:p-7">
            {needsSetup ? (
              <Field id="admin-name" label={t("admin.ownerName")} autoComplete="name" value={name} onChange={setName} />
            ) : null}
            <Field
              id="admin-email"
              label={t("admin.ownerEmail")}
              type="email"
              autoComplete="username"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
            />
            {needsSetup ? (
              <Field
                id="admin-phone"
                label={t("admin.ownerPhone")}
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={setPhone}
                placeholder="01XXXXXXXXX"
              />
            ) : null}
            <div>
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
                  autoComplete={needsSetup ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="ad-input h-12 w-full rounded-xl px-4 pr-20 text-sm"
                  placeholder={needsSetup ? t("admin.passwordHint") : "••••••••••••"}
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute inset-y-0 right-0 px-3 text-xs font-semibold text-white/45 transition hover:text-white"
                >
                  {show ? t("admin.hide") : t("admin.show")}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={pending || !canSubmit}
              className="ad-btn h-12 w-full text-sm disabled:cursor-not-allowed"
            >
              {pending ? t("admin.checking") : needsSetup ? t("admin.createOwner") : t("admin.enterDesk")}
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

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="ad-input mt-2 h-12 w-full rounded-xl px-4 text-sm"
      />
    </div>
  );
}

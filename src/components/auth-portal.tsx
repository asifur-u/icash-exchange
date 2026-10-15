"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/provider";
import { notifyError, notifySuccess } from "@/lib/swal";

export function AuthPortal({
  nextPath,
  resumePath = null,
}: {
  nextPath: string;
  resumePath?: string | null;
}) {
  const t = useT();
  const router = useRouter();

  function passwordHint(password: string) {
    if (!password) return "";
    const parts: string[] = [];
    if (password.length < 8) parts.push("8+ characters");
    if (!/[A-Za-z]/.test(password)) parts.push("a letter");
    if (!/[0-9]/.test(password)) parts.push("a number");
    return parts.length
      ? t("auth.needChars", { parts: parts.join(", ") })
      : t("auth.strongEnough");
  }
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [csrf, setCsrf] = useState("");

  async function loadCsrf() {
    try {
      const res = await fetch("/api/auth/csrf", { method: "GET", credentials: "same-origin" });
      const data = (await res.json()) as { token?: string };
      if (data.token) setCsrf(data.token);
    } catch {
      /* ignore — submit will fail closed */
    }
  }

  useEffect(() => {
    void loadCsrf();
    if (resumePath?.startsWith("/checkout")) {
      try {
        sessionStorage.setItem("icash_pending_buy", resumePath);
      } catch {
        /* ignore */
      }
    }
  }, [resumePath]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!csrf) {
      await loadCsrf();
      await notifyError(t("auth.securityCheck"), t("auth.refreshTry"));
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrf,
        },
        body: JSON.stringify(
          mode === "login" ? { email, password } : { name, email, phone, password },
        ),
      });
      const data = await response.json();
      if (!response.ok) {
        setBusy(false);
        // Rotate CSRF after failures so retries stay valid.
        void loadCsrf();
        await notifyError(
          mode === "login" ? t("auth.loginFail") : t("auth.registerFail"),
          data.error?.message ?? t("auth.tryAgain"),
        );
        return;
      }
      setBusy(false);
      await notifySuccess(
        mode === "login" ? t("auth.loginOk") : t("auth.registerOk"),
        t("auth.openingDash"),
      );
      router.replace(nextPath || "/account");
      router.refresh();
    } catch {
      setBusy(false);
      void loadCsrf();
      await notifyError(t("auth.somethingWrong"), t("auth.tryAgain"));
    }
  }

  const hint = mode === "register" ? passwordHint(password) : "";

  return (
    <div className="w-full">
      <div className="mb-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
          {t("auth.secureAccess")}
        </p>
        <h1 className="mt-2 text-[2rem] font-semibold tracking-tight text-white sm:text-[2.35rem]">
          {mode === "login" ? t("auth.loginHeading") : t("auth.registerHeading")}
        </h1>
        <p className="mt-2 text-base leading-relaxed text-white/55">
          {mode === "login" ? t("auth.loginLead") : t("auth.registerLead")}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-1 rounded-full border border-white/12 bg-[#111] p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`h-10 rounded-full text-sm font-semibold transition ${
            mode === "login" ? "bg-white text-black" : "text-white/55 hover:text-white"
          }`}
        >
          {t("auth.loginTitle")}
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`h-10 rounded-full text-sm font-semibold transition ${
            mode === "register" ? "bg-white text-black" : "text-white/55 hover:text-white"
          }`}
        >
          {t("auth.registerTitle")}
        </button>
      </div>

      <form className="space-y-4" onSubmit={submit} noValidate>
        {mode === "register" ? (
          <>
            <Field
              id="name"
              label={t("auth.name")}
              value={name}
              onChange={setName}
              placeholder="Asif Rahman"
              autoComplete="name"
              required
            />
            <Field
              id="phone"
              label={t("auth.phone")}
              value={phone}
              onChange={(value) => setPhone(value.replace(/\D/g, "").slice(0, 11))}
              placeholder="01XXXXXXXXX"
              inputMode="numeric"
              autoComplete="tel"
              required
            />
          </>
        ) : null}

        <Field
          id="email"
          label={t("auth.email")}
          value={email}
          onChange={setEmail}
          placeholder="you@email.com"
          type="email"
          autoComplete="email"
          required
        />

        <label className="block" htmlFor="password">
          <span className="mb-2 block text-sm font-medium text-white/70">{t("auth.password")}</span>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={mode === "register" ? 8 : 1}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={
                mode === "register"
                  ? t("auth.passwordPlaceholderRegister")
                  : t("auth.passwordPlaceholderLogin")
              }
              className="h-12 w-full rounded-xl border border-white/12 bg-[#111] px-4 pr-20 text-base text-white outline-none transition placeholder:text-white/30 focus:border-white/40 focus:bg-[#141414]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute inset-y-0 right-0 px-4 text-sm font-medium text-white/50 transition hover:text-white"
            >
              {showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
            </button>
          </div>
          {hint ? (
            <p
              className={`mt-1.5 text-xs ${
                hint === t("auth.strongEnough") ? "text-[#9fe870]/80" : "text-white/40"
              }`}
            >
              {hint}
            </p>
          ) : null}
        </label>

        <Button
          type="submit"
          className="mt-2 h-12 w-full text-base font-semibold"
          disabled={busy || !csrf}
          aria-busy={busy}
        >
          {busy
            ? t("auth.checking")
            : !csrf
              ? t("auth.securityWait")
              : mode === "login"
                ? t("auth.submitLogin")
                : t("auth.submitRegister")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-white/50">
        {mode === "login" ? (
          <button
            type="button"
            onClick={() => setMode("register")}
            className="font-semibold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white"
          >
            {t("auth.switchToRegister")}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMode("login")}
            className="font-semibold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white"
          >
            {t("auth.switchToLogin")}
          </button>
        )}
      </p>

      <p className="mt-8 text-center text-xs leading-relaxed text-white/35">
        CSRF + rate limits + httpOnly cookies. By continuing you agree to our{" "}
        <Link href="/legal/terms" className="text-white/55 underline underline-offset-2">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/legal/privacy" className="text-white/55 underline underline-offset-2">
          Privacy
        </Link>
        .
      </p>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  autoComplete,
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block text-sm font-medium text-white/70">{label}</span>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-white/12 bg-[#111] px-4 text-base text-white outline-none transition placeholder:text-white/30 focus:border-white/40 focus:bg-[#141414]"
      />
    </label>
  );
}

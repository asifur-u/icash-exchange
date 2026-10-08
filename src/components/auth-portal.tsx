"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AuthPortal({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          mode === "login" ? { email, password } : { name, email, phone, password },
        ),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error?.message ?? "Could not continue.");
        setBusy(false);
        return;
      }
      router.replace(nextPath || "/account");
      router.refresh();
    } catch {
      setError("Could not continue. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-[2rem] font-semibold tracking-tight text-white sm:text-[2.35rem]">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-base leading-relaxed text-white/55">
          {mode === "login"
            ? "Log in to open your dashboard and continue a purchase."
            : "One account for notes, deposits, and your voucher codes."}
        </p>
      </div>

      <form className="space-y-4" onSubmit={submit} noValidate>
        {mode === "register" ? (
          <>
            <Field
              id="name"
              label="Full name"
              value={name}
              onChange={setName}
              placeholder="Asif Rahman"
              autoComplete="name"
              required
            />
            <Field
              id="phone"
              label="Mobile number"
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
          label="Email"
          value={email}
          onChange={setEmail}
          placeholder="you@email.com"
          type="email"
          autoComplete="email"
          required
        />

        <label className="block" htmlFor="password">
          <span className="mb-2 block text-sm font-medium text-white/70">Password</span>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={mode === "register" ? "At least 6 characters" : "Your password"}
              className="h-12 w-full rounded-xl border border-white/12 bg-[#111] px-4 pr-20 text-base text-white outline-none transition placeholder:text-white/30 focus:border-white/40 focus:bg-[#141414]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute inset-y-0 right-0 px-4 text-sm font-medium text-white/50 transition hover:text-white"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        {error ? (
          <div className="rounded-xl border border-[#ff2d2d]/40 bg-[#ff2d2d]/10 px-4 py-3 text-sm text-[#ffb4b4]">
            {error}
          </div>
        ) : null}

        <Button className="mt-2 h-12 w-full text-base font-semibold" disabled={busy} aria-busy={busy}>
          {busy ? "Working…" : mode === "login" ? "Log in to dashboard" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-white/50">
        {mode === "login" ? (
          <>
            New here?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
              }}
              className="font-semibold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white"
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className="font-semibold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white"
            >
              Log in
            </button>
          </>
        )}
      </p>

      <p className="mt-8 text-center text-xs leading-relaxed text-white/35">
        By continuing you agree to our{" "}
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

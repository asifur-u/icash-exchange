"use client";

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
          mode === "login"
            ? { email, password }
            : { name, email, phone, password },
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
    <div className="premium-card mx-auto w-full max-w-md rounded-[28px] p-6 sm:p-8">
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/[0.04] p-1">
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
            mode === "register" ? "bg-white text-black" : "text-white/60"
          }`}
        >
          Register
        </button>
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
            mode === "login" ? "bg-white text-black" : "text-white/60"
          }`}
        >
          Log in
        </button>
      </div>

      <form className="mt-8 space-y-4" onSubmit={submit}>
        {mode === "register" ? (
          <>
            <Field label="Name" value={name} onChange={setName} placeholder="Your name" required />
            <Field label="Mobile" value={phone} onChange={setPhone} placeholder="01XXXXXXXXX" required />
          </>
        ) : null}
        <Field
          label="Email"
          value={email}
          onChange={setEmail}
          placeholder="you@email.com"
          type="email"
          required
        />
        <Field
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder={mode === "register" ? "At least 6 characters" : "Your password"}
          type="password"
          required
        />

        {error ? <p className="text-sm text-[#ff6b6b]">{error}</p> : null}

        <Button className="mt-2 h-14 w-full text-base" disabled={busy}>
          {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-sm leading-relaxed text-white/45">
        After you sign in, your dashboard shows how to pay and every order you start.
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</span>
      <input
        className="mt-2 h-12 w-full rounded-2xl border border-white/15 bg-black px-4 text-base text-white outline-none placeholder:text-white/30 focus:border-white/40"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        required={required}
      />
    </label>
  );
}

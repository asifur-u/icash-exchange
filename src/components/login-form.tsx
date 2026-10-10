"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { notifyError, notifySuccess } from "@/lib/swal";

export function LoginForm() {
  const [password, setPassword] = useState("");
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
        await notifyError("Access denied", data.error?.message ?? "That password does not match.");
        setPending(false);
        return;
      }
      await notifySuccess("Welcome", "Opening the owner desk…");
      window.location.assign("/admin");
    } catch {
      await notifyError("Access denied", "That password does not match.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm">
      <label className="text-[11px] uppercase tracking-[0.18em] text-gold" htmlFor="password">
        Password
      </label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="mt-2 w-full border-b border-white/20 bg-transparent py-3 text-white outline-none focus:border-gold"
      />
      <Button type="submit" className="mt-8" disabled={pending}>
        {pending ? "Checking…" : "Enter"}
      </Button>
    </form>
  );
}

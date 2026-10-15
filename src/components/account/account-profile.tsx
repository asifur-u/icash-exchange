"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { notifyError, notifySuccess } from "@/lib/swal";
import type { PublicUser } from "@/lib/users";

export function AccountProfile({ user }: { user: PublicUser }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [busy, setBusy] = useState<"profile" | "password" | "avatar" | null>(null);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setBusy("profile");
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "Could not update profile.");
      setBusy(null);
      await notifySuccess("Profile saved", "Your account details are up to date.");
      router.refresh();
    } catch (error) {
      setBusy(null);
      await notifyError(
        "Could not update profile",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    setBusy("password");
    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword, nextPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "Could not change password.");
      setCurrentPassword("");
      setNextPassword("");
      setBusy(null);
      await notifySuccess("Password updated", "Use the new password next time you log in.");
    } catch (error) {
      setBusy(null);
      await notifyError(
        "Could not change password",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    }
  }

  async function onAvatar(file: File | null) {
    if (!file) return;
    setBusy("avatar");
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read image."));
        reader.readAsDataURL(file);
      });
      const response = await fetch("/api/auth/avatar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ avatarDataUrl: dataUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "Could not upload avatar.");
      setAvatarUrl(data.user?.avatarUrl ?? "");
      setBusy(null);
      await notifySuccess("Photo updated", "Your avatar is ready.");
      router.refresh();
    } catch (error) {
      setBusy(null);
      await notifyError(
        "Could not upload avatar",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    }
  }

  const initial = (name || user.name).slice(0, 1).toUpperCase();

  return (
    <div className="space-y-5">
      <header className="rounded-[28px] border border-zinc-200 bg-white shadow-sm p-6 sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ff2d2d]">Profile</p>
        <h1 className="mt-2 display text-[clamp(2rem,6vw,3.2rem)] leading-[0.95]">
          Update account.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-500">
          Change your name, mobile, password, or photo anytime.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <form
          onSubmit={saveProfile}
          className="rounded-[26px] border border-zinc-200 bg-white shadow-sm p-5 sm:p-6"
        >
          <p className="text-sm font-semibold text-zinc-900">Account details</p>
          <label className="mt-5 block">
            <span className="mb-1.5 block text-xs text-zinc-500">Full name</span>
            <input
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="mt-3 block">
            <span className="mb-1.5 block text-xs text-zinc-500">Mobile</span>
            <input
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
              required
            />
          </label>
          <p className="mt-3 text-xs text-zinc-400">Email is fixed: {user.email}</p>
          <button
            type="submit"
            disabled={busy === "profile"}
            className="mt-5 inline-flex h-11 items-center rounded-xl bg-[#ff2d2d] px-5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy === "profile" ? "Saving…" : "Save profile"}
          </button>
        </form>

        <form
          onSubmit={savePassword}
          className="rounded-[26px] border border-zinc-200 bg-white shadow-sm p-5 sm:p-6"
        >
          <p className="text-sm font-semibold text-zinc-900">Change password</p>
          <label className="mt-5 block">
            <span className="mb-1.5 block text-xs text-zinc-500">Current password</span>
            <input
              type="password"
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </label>
          <label className="mt-3 block">
            <span className="mb-1.5 block text-xs text-zinc-500">New password</span>
            <input
              type="password"
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
              value={nextPassword}
              onChange={(e) => setNextPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>
          <button
            type="submit"
            disabled={busy === "password"}
            className="mt-5 inline-flex h-11 items-center rounded-xl bg-[#ff2d2d] px-5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy === "password" ? "Updating…" : "Update password"}
          </button>
        </form>

        <div className="rounded-[26px] border border-zinc-200 bg-white shadow-sm p-5 sm:p-6 lg:col-span-2">
          <p className="text-sm font-semibold text-zinc-900">Avatar</p>
          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-zinc-500">
                  {initial}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-zinc-500">PNG, JPG or WebP under 2.5 MB.</p>
              <label className="mt-3 inline-flex h-11 cursor-pointer items-center rounded-xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-50">
                {busy === "avatar" ? "Uploading…" : "Choose photo"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={busy === "avatar"}
                  onChange={(e) => onAvatar(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

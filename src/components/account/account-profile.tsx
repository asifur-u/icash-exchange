"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/i18n/provider";
import { notifyError, notifySuccess } from "@/lib/swal";
import type { PublicUser } from "@/lib/users";

export function AccountProfile({ user }: { user: PublicUser }) {
  const t = useT();
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
    <div className="space-y-5 sm:space-y-6" style={{ color: "#09090b" }}>
      <header className="al-card overflow-hidden">
        <div className="relative overflow-hidden bg-[#0a0a0a] px-5 py-6 sm:px-7 sm:py-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(ellipse 60% 70% at 15% 0%, rgba(225,29,46,0.35), transparent 55%)",
            }}
          />
          <div className="relative flex items-center gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-xl font-bold text-white sm:h-20 sm:w-20"
              style={{
                background: "linear-gradient(145deg, #e11d2e, #9f1239)",
                boxShadow: "0 12px 28px rgba(225,29,46,0.35)",
              }}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ff5a67]">
                {t("account.profile")}
              </p>
              <h1 className="mt-1 truncate text-[clamp(1.6rem,4vw,2.4rem)] font-extrabold tracking-tight text-white">
                {t("account.profileTitle")}
              </h1>
              <p className="mt-1 text-sm text-white/55">{t("account.profileLead")}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="al-card p-5 sm:p-6">
          <p className="text-sm font-semibold text-zinc-900">{t("account.accountDetails")}</p>
          <label className="mt-5 block">
            <span className="mb-1.5 block text-xs text-zinc-500">{t("account.fullName")}</span>
            <input
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="mt-3 block">
            <span className="mb-1.5 block text-xs text-zinc-500">{t("account.mobile")}</span>
            <input
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
              required
            />
          </label>
          <p className="mt-3 text-xs text-zinc-400">
            {t("account.emailFixed", { email: user.email })}
          </p>
          <button
            type="submit"
            disabled={busy === "profile"}
            className="al-btn al-btn-primary mt-5 disabled:opacity-60"
          >
            {busy === "profile" ? t("account.saving") : t("account.saveProfile")}
          </button>
        </form>

        <form onSubmit={savePassword} className="al-card p-5 sm:p-6">
          <p className="text-sm font-semibold text-zinc-900">{t("account.changePassword")}</p>
          <label className="mt-5 block">
            <span className="mb-1.5 block text-xs text-zinc-500">{t("account.currentPassword")}</span>
            <input
              type="password"
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </label>
          <label className="mt-3 block">
            <span className="mb-1.5 block text-xs text-zinc-500">{t("account.newPassword")}</span>
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
            className="al-btn al-btn-primary mt-5 disabled:opacity-60"
          >
            {busy === "password" ? t("account.updating") : t("account.updatePassword")}
          </button>
        </form>

        <div className="al-card p-5 sm:p-6 lg:col-span-2">
          <p className="text-sm font-semibold text-zinc-900">{t("account.avatar")}</p>
          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
            <div
              className="relative h-20 w-20 overflow-hidden rounded-2xl border border-zinc-200"
              style={{ background: "linear-gradient(145deg, #e11d2e, #9f1239)" }}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-white">
                  {initial}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-zinc-500">{t("account.avatarHint")}</p>
              <label className="al-btn al-btn-ghost mt-3 inline-flex cursor-pointer">
                {busy === "avatar" ? t("account.uploading") : t("account.choosePhoto")}
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

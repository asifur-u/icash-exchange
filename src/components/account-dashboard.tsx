"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ContinueBuy } from "@/components/continue-buy";
import { LogoutButton } from "@/components/logout-button";
import { formatBdt, formatWhen } from "@/lib/format";
import type { PublicUser } from "@/lib/users";

type UserOrder = {
  id: string;
  number: string;
  status: string;
  total: number;
  title: string;
  createdAt: string;
  paymentMethod?: string;
  transactionId?: string;
  proofSubmittedAt?: string;
  deliveredAt?: string;
  token: string;
};

const guide = [
  {
    title: "Pick a note",
    body: "Open Catalog or Buy. Choose a face value and quantity.",
  },
  {
    title: "Send the deposit",
    body: "Pay with bKash, Nagad, Rocket or bank. Add the TrxID and a clear screenshot.",
  },
  {
    title: "Wait for the desk",
    body: "The owner matches your proof. That usually takes a few minutes while they are online.",
  },
  {
    title: "Read the code",
    body: "When the order is delivered, open it here and copy the code.",
  },
];

function statusTone(status: string) {
  if (status === "DELIVERED") return "border-[#9fe870]/40 bg-[#9fe870]/10 text-[#9fe870]";
  if (status === "REVIEWING") return "border-amber-200/30 bg-amber-200/10 text-amber-100";
  if (status === "PENDING") return "border-white/20 bg-white/5 text-white/75";
  if (status === "FAILED" || status === "REFUNDED") return "border-red-300/30 bg-red-400/10 text-red-200";
  return "border-white/20 text-white/80";
}

export function AccountDashboard({ user, orders }: { user: PublicUser; orders: UserOrder[] }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [profileMsg, setProfileMsg] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [avatarMsg, setAvatarMsg] = useState("");
  const [busy, setBusy] = useState<"profile" | "password" | "avatar" | null>(null);

  const stats = useMemo(() => {
    const open = orders.filter((o) => o.status === "PENDING" || o.status === "REVIEWING").length;
    const delivered = orders.filter((o) => o.status === "DELIVERED").length;
    const spent = orders.reduce((sum, o) => sum + o.total, 0);
    return { open, delivered, spent, total: orders.length };
  }, [orders]);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setBusy("profile");
    setProfileMsg("");
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "Could not update profile.");
      setProfileMsg("Profile saved.");
      router.refresh();
    } catch (error) {
      setProfileMsg(error instanceof Error ? error.message : "Could not update profile.");
    } finally {
      setBusy(null);
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    setBusy("password");
    setPasswordMsg("");
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
      setPasswordMsg("Password updated.");
    } catch (error) {
      setPasswordMsg(error instanceof Error ? error.message : "Could not change password.");
    } finally {
      setBusy(null);
    }
  }

  async function onAvatar(file: File | null) {
    if (!file) return;
    setBusy("avatar");
    setAvatarMsg("");
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
      setAvatarMsg("Photo updated.");
      router.refresh();
    } catch (error) {
      setAvatarMsg(error instanceof Error ? error.message : "Could not upload avatar.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-white/15 bg-[#141414] sm:h-20 sm:w-20">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-white/50">
                {user.name.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="eyebrow">Your desk</p>
            <h1 className="mt-3 display text-[clamp(2.2rem,9vw,4.4rem)]">
              Hello, <span className="accent-red">{user.name.split(" ")[0]}.</span>
            </h1>
            <p className="mt-3 max-w-xl text-base text-white/60 sm:text-lg">
              {user.email} · {user.phone}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/order/note-1000"
            className="inline-flex h-12 items-center rounded-full bg-white px-6 text-sm font-semibold text-black"
          >
            Buy a note
          </Link>
          <LogoutButton />
        </div>
      </div>

      <ContinueBuy />

      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        <Stat label="Orders" value={String(stats.total)} />
        <Stat label="Open / reviewing" value={String(stats.open)} />
        <Stat label="Delivered" value={`${stats.delivered} · ${formatBdt(stats.spent)}`} />
      </div>

      <div className="mt-12">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/40">How to buy</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {guide.map((item, index) => (
            <div key={item.title} className="rounded-[22px] border border-white/10 bg-[#0c0c0c] p-5">
              <p className="text-xs font-semibold text-[#ff2d2d]">0{index + 1}</p>
              <h2 className="mt-3 text-lg font-semibold tracking-tight">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Orders</p>
            <h2 className="mt-3 display-soft text-3xl sm:text-4xl">Your notes</h2>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="premium-card mt-8 rounded-[28px] p-8">
            <p className="text-xl font-semibold tracking-tight">No orders yet.</p>
            <p className="mt-3 max-w-md text-base text-white/55">
              Start with a note. After you send the deposit, it will show here with its status.
            </p>
            <Link
              href="/catalog"
              className="mt-6 inline-flex h-12 items-center rounded-full bg-white px-6 text-sm font-semibold text-black"
            >
              Open catalog
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}?t=${order.token}`}
                className="premium-card flex flex-col gap-3 rounded-[24px] p-5 transition hover:border-white/30 sm:flex-row sm:items-center sm:justify-between sm:p-6"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/40">{order.number}</p>
                  <p className="mt-2 text-xl font-semibold tracking-tight">
                    {order.title} · {formatBdt(order.total)}
                  </p>
                  <p className="mt-1 text-sm text-white/45">
                    {formatWhen(order.createdAt)}
                    {order.paymentMethod ? ` · ${order.paymentMethod}` : ""}
                    {order.transactionId ? ` · ${order.transactionId}` : ""}
                  </p>
                </div>
                <span
                  className={`inline-flex h-10 items-center self-start rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.16em] ${statusTone(order.status)}`}
                >
                  {order.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-16 grid gap-6 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="premium-card rounded-[28px] p-6 sm:p-8">
          <p className="eyebrow">Profile</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Account details</h2>
          <label className="mt-6 block">
            <span className="mb-2 block text-sm text-white/60">Full name</span>
            <input
              className="h-12 w-full rounded-2xl border border-white/12 bg-black px-4 text-white outline-none focus:border-white/35"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="mt-4 block">
            <span className="mb-2 block text-sm text-white/60">Mobile</span>
            <input
              className="h-12 w-full rounded-2xl border border-white/12 bg-black px-4 text-white outline-none focus:border-white/35"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
              required
            />
          </label>
          <p className="mt-3 text-sm text-white/40">Email is fixed: {user.email}</p>
          {profileMsg ? <p className="mt-3 text-sm text-white/70">{profileMsg}</p> : null}
          <button
            type="submit"
            disabled={busy === "profile"}
            className="mt-6 inline-flex h-12 items-center rounded-full bg-white px-6 text-sm font-semibold text-black disabled:opacity-60"
          >
            {busy === "profile" ? "Saving…" : "Save profile"}
          </button>
        </form>

        <div className="grid gap-6">
          <form onSubmit={savePassword} className="premium-card rounded-[28px] p-6 sm:p-8">
            <p className="eyebrow">Security</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Change password</h2>
            <label className="mt-6 block">
              <span className="mb-2 block text-sm text-white/60">Current password</span>
              <input
                type="password"
                className="h-12 w-full rounded-2xl border border-white/12 bg-black px-4 text-white outline-none focus:border-white/35"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm text-white/60">New password</span>
              <input
                type="password"
                className="h-12 w-full rounded-2xl border border-white/12 bg-black px-4 text-white outline-none focus:border-white/35"
                value={nextPassword}
                onChange={(e) => setNextPassword(e.target.value)}
                minLength={6}
                required
              />
            </label>
            {passwordMsg ? <p className="mt-3 text-sm text-white/70">{passwordMsg}</p> : null}
            <button
              type="submit"
              disabled={busy === "password"}
              className="mt-6 inline-flex h-12 items-center rounded-full bg-white px-6 text-sm font-semibold text-black disabled:opacity-60"
            >
              {busy === "password" ? "Updating…" : "Update password"}
            </button>
          </form>

          <div className="premium-card rounded-[28px] p-6 sm:p-8">
            <p className="eyebrow">Photo</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Avatar</h2>
            <p className="mt-2 text-sm text-white/50">PNG, JPG or WebP under 2.5 MB. Uses ImageKit when configured.</p>
            <label className="mt-5 inline-flex h-12 cursor-pointer items-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white/90">
              {busy === "avatar" ? "Uploading…" : "Choose photo"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={busy === "avatar"}
                onChange={(e) => onAvatar(e.target.files?.[0] ?? null)}
              />
            </label>
            {avatarMsg ? <p className="mt-3 text-sm text-white/70">{avatarMsg}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-[#0c0c0c] px-5 py-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}

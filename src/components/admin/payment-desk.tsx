"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useT } from "@/i18n/provider";
import { downloadText, exportOrdersCsv } from "@/lib/admin-ops";
import { notifySuccess } from "@/lib/swal";
import type { DeskAdmin } from "@/lib/admins";
import type { AdminSnapshot } from "@/lib/types";

type DepositRow = {
  id: string;
  label: string;
  hint: string;
  number: string;
  name: string;
  note?: string;
};

type PaymentDeskConfig = {
  paymentMode: "demo" | "live";
  feePercent: number;
  deposits: DepositRow[];
  icash: { email: { admin: string[] } };
};

const ACCENT: Record<string, string> = {
  bkash: "#E2136E",
  nagad: "#F47722",
  rocket: "#8C3494",
  bank: "#e11d2e",
};

const LOGO: Record<string, string> = {
  bkash: "/payments/bkash.png",
  nagad: "/payments/nagad.png",
  rocket: "/payments/rocket.png",
  bank: "/payments/bank.png",
};

async function post(url: string, body?: unknown, method = "POST") {
  const response = await fetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: method === "DELETE" ? undefined : JSON.stringify(body ?? {}),
  });
  const data = (await response.json()) as { error?: { message?: string }; account?: { number: string; name: string } };
  if (!response.ok) throw new Error(data.error?.message ?? "The desk refused that action");
  return data;
}

export function PaymentDesk({
  desk,
  snapshot,
  me,
  staff,
  busy,
  onRun,
}: {
  desk: PaymentDeskConfig;
  snapshot: AdminSnapshot;
  me: DeskAdmin;
  staff: DeskAdmin[];
  busy: boolean;
  onRun: (action: () => Promise<string>) => Promise<void>;
}) {
  const t = useT();

  return (
    <section className="mt-1 space-y-4 md:mt-4">
      <div className="flex flex-wrap items-center gap-2 admin-card px-3 py-2.5">
        <span
          className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
          style={
            desk.paymentMode === "live"
              ? { background: "rgba(6,78,59,0.45)", color: "#6ee7b7" }
              : { background: "rgba(120,53,15,0.4)", color: "#fde68a" }
          }
        >
          {desk.paymentMode}
        </span>
        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/70">
          {t("admin.deskFee")} {desk.feePercent}%
        </span>
        {desk.icash.email.admin.slice(0, 2).map((email) => (
          <span key={email} className="max-w-[220px] truncate rounded-full bg-white/5 px-2.5 py-1 font-mono text-[11px] text-white/60">
            {email}
          </span>
        ))}
        <span className="ml-auto flex gap-1.5">
          <a
            href="/"
            className="inline-flex h-8 items-center rounded-lg border border-white/12 px-3 text-[11px] font-semibold text-white/75 hover:bg-white/5"
          >
            {t("admin.openStorefront")}
          </a>
          <button
            type="button"
            onClick={() => {
              downloadText(`icash-orders-${new Date().toISOString().slice(0, 10)}.csv`, exportOrdersCsv(snapshot));
              void notifySuccess(t("admin.exported"), t("admin.csvDownloaded"));
            }}
            className="inline-flex h-8 items-center rounded-lg border border-white/12 px-3 text-[11px] font-semibold text-white/75 hover:bg-white/5"
          >
            {t("admin.exportOrdersArrow")}
          </button>
        </span>
      </div>

      <div>
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">{t("admin.receivingNumbers")}</p>
            <h2 className="text-lg font-bold tracking-tight">{t("admin.payWallets")}</h2>
          </div>
          <p className="max-w-sm text-[11px] leading-relaxed text-white/40 sm:text-right">{t("admin.payWalletHint")}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {desk.deposits.map((account) => (
            <WalletCard key={account.id} account={account} busy={busy} onRun={onRun} />
          ))}
        </div>
      </div>

      <OwnerTeam me={me} staff={staff} busy={busy} onRun={onRun} />
    </section>
  );
}

function WalletCard({
  account,
  busy,
  onRun,
}: {
  account: DepositRow;
  busy: boolean;
  onRun: (action: () => Promise<string>) => Promise<void>;
}) {
  const t = useT();
  const [number, setNumber] = useState(account.number);
  const [name, setName] = useState(account.name);
  useEffect(() => {
    setNumber(account.number);
    setName(account.name);
  }, [account.number, account.name]);
  const dirty = number.trim() !== account.number || name.trim() !== account.name;
  const accent = ACCENT[account.id] ?? "#e11d2e";
  const logo = LOGO[account.id];

  return (
    <article className="overflow-hidden admin-card">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <span
          className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-black"
          style={{ boxShadow: `0 0 0 1px ${accent}55, 0 8px 18px ${accent}22` }}
        >
          {logo ? (
            <Image src={logo} alt="" width={28} height={28} className="h-7 w-7 object-contain" />
          ) : null}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold tracking-tight">{account.label}</p>
          <p className="text-[11px] text-white/40">{account.hint}</p>
        </div>
      </div>
      <form
        className="space-y-2.5 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void onRun(async () => {
            const data = await post("/api/admin/deposits", { id: account.id, number, name }, "POST");
            if (data.account?.number) setNumber(data.account.number);
            if (data.account?.name) setName(data.account.name);
            return t("admin.paySaved");
          });
        }}
      >
        <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
          {t("admin.payNumber")}
          <input
            value={number}
            onChange={(event) => setNumber(event.target.value)}
            inputMode="numeric"
            className="mt-1.5 h-11 w-full rounded-xl border border-white/12 bg-black/50 px-3 font-mono text-sm font-semibold tracking-wide text-white outline-none focus:border-white/40"
          />
        </label>
        <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
          {t("admin.payAccountName")}
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1.5 h-10 w-full rounded-xl border border-white/12 bg-black/50 px-3 text-sm text-white outline-none focus:border-white/40"
          />
        </label>
        <button
          type="submit"
          disabled={busy || !dirty}
          className="inline-flex h-10 w-full items-center justify-center rounded-xl text-sm font-semibold text-white disabled:opacity-35"
          style={{ background: accent }}
        >
          {t("admin.paySave")}
        </button>
      </form>
    </article>
  );
}

function OwnerTeam({
  me,
  staff,
  busy,
  onRun,
}: {
  me: DeskAdmin;
  staff: DeskAdmin[];
  busy: boolean;
  onRun: (action: () => Promise<string>) => Promise<void>;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const canAdd = name.trim().length >= 2 && email.includes("@") && /^01\d{9}$/.test(phone) && password.length >= 8;
  const field =
    "ad-input h-10 rounded-xl px-3 text-sm";

  return (
    <section className="overflow-hidden admin-card">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">{t("admin.teamEyebrow")}</p>
          <h2 className="text-base font-bold tracking-tight">{t("admin.teamTitle")}</h2>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="ad-btn h-8 rounded-lg px-3 text-[11px] shadow-none"
        >
          {open ? t("admin.hide") : t("admin.addOwner")}
        </button>
      </div>
      <ul className="divide-y divide-white/10">
        {staff.map((admin) => {
          const mine = admin.id === me.id;
          return (
            <li key={admin.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {admin.name}
                  {mine ? (
                    <span className="ad-chip-live ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]">
                      {t("admin.you")}
                    </span>
                  ) : null}
                </p>
                <p className="truncate font-mono text-[11px] text-white/40">
                  {admin.email} · {admin.phone}
                </p>
              </div>
              {mine || staff.length <= 1 ? null : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void onRun(async () => {
                      await post(`/api/admin/staff/${admin.id}`, undefined, "DELETE");
                      return t("admin.ownerRemoved");
                    })
                  }
                  className="shrink-0 text-[11px] font-semibold text-white/45 hover:text-white disabled:opacity-40"
                >
                  {t("admin.removeOwner")}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {open ? (
        <form
          className="grid gap-2 border-t border-white/10 p-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            void onRun(async () => {
              await post("/api/admin/staff", { name, email, phone, password });
              setName("");
              setEmail("");
              setPhone("");
              setPassword("");
              setOpen(false);
              return t("admin.ownerAdded");
            });
          }}
        >
          <input required value={name} onChange={(event) => setName(event.target.value)} placeholder={t("admin.ownerName")} className={field} />
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t("admin.ownerEmail")} className={field} />
          <input required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder={t("admin.ownerPhone")} className={field} />
          <input
            required
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t("admin.passwordHint")}
            className={field}
          />
          <button
            type="submit"
            disabled={busy || !canAdd}
            className="ad-btn h-10 text-sm sm:col-span-2"
          >
            {t("admin.addOwner")}
          </button>
        </form>
      ) : null}
    </section>
  );
}

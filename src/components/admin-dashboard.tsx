"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { formatBdt, formatWhen } from "@/lib/format";
import { notifyError, notifySuccess } from "@/lib/swal";
import type { AdminSnapshot } from "@/lib/types";

async function post(url: string, body?: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : "{}",
  });
  const data = (await response.json()) as {
    error?: { message?: string };
    message?: string;
    added?: number;
    codes?: string[];
  };
  if (!response.ok) throw new Error(data.error?.message ?? "The desk refused that action");
  return data;
}

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

export function AdminDashboard({ snapshot }: { snapshot: AdminSnapshot }) {
  const router = useRouter();
  const [slug, setSlug] = useState(snapshot.products[0]?.slug ?? "");
  const [csv, setCsv] = useState("");
  const [pending, setPending] = useState(false);
  const [unlockedCodes, setUnlockedCodes] = useState<string[]>([]);
  const [revealedByOrder, setRevealedByOrder] = useState<Record<string, string[]>>({});

  const reviewing = snapshot.orders.filter((order) => order.status === "REVIEWING");
  const others = snapshot.orders.filter((order) => order.status !== "REVIEWING");

  const kpis = useMemo(() => {
    const ready = snapshot.products.reduce((sum, p) => sum + p.stock, 0);
    const held = snapshot.products.reduce((sum, p) => sum + p.reserved, 0);
    const sold = snapshot.products.reduce((sum, p) => sum + p.sold, 0);
    return { ready, held, sold, inbox: reviewing.length, orders: snapshot.orders.length };
  }, [snapshot.products, reviewing.length, snapshot.orders.length]);

  async function run(action: () => Promise<string>) {
    setPending(true);
    try {
      const result = await action();
      await notifySuccess("Done", result);
      router.refresh();
    } catch (caught) {
      await notifyError(
        "Desk refused",
        caught instanceof Error ? caught.message : "The desk refused that action",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-black">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[26rem] bg-[radial-gradient(70%_80%_at_10%_0%,rgba(255,45,45,0.22),transparent_55%),radial-gradient(50%_60%_at_90%_0%,rgba(255,255,255,0.05),transparent_50%)]"
      />

      <div className="relative mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-8 sm:py-12">
        <motion.header
          className="overflow-hidden rounded-[30px] border border-white/12 bg-[#0a0a0a]"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div
            aria-hidden="true"
            className="h-px bg-gradient-to-r from-transparent via-[#ff2d2d] to-transparent"
          />
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ff2d2d]">Owner desk</p>
              <h1 className="mt-2 display text-[clamp(2.4rem,7vw,3.8rem)] leading-[0.95]">
                Command <span className="accent-red">center.</span>
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/50">
                Inbox first. Codes stay offline until you approve or reveal. Max 3 desk actions at once.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white/80 transition hover:border-white hover:text-white"
              onClick={async () => {
                await fetch("/api/admin/logout", { method: "POST" });
                router.replace("/admin/login");
                router.refresh();
              }}
            >
              Lock desk
            </button>
          </div>

          <div className="grid border-t border-white/10 sm:grid-cols-5">
            <Kpi label="Inbox" value={String(kpis.inbox)} hot />
            <Kpi label="Orders" value={String(kpis.orders)} />
            <Kpi label="Ready" value={String(kpis.ready)} />
            <Kpi label="Held" value={String(kpis.held)} />
            <Kpi label="Sold" value={String(kpis.sold)} />
          </div>
        </motion.header>

        <div className="mt-8 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
          <section className="min-w-0">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Live</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Payment inbox</h2>
              </div>
              <span className="rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-100">
                {reviewing.length} waiting
              </span>
            </div>

            {unlockedCodes.length > 0 ? (
              <div className="mb-5 overflow-hidden rounded-[24px] border border-[#9fe870]/30 bg-[#0f160f]">
                <div className="border-b border-[#9fe870]/20 px-5 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9fe870]">
                    Just unlocked — copy & send
                  </p>
                </div>
                <div className="grid gap-3 p-4">
                  {unlockedCodes.map((code) => (
                    <div
                      key={code}
                      className="flex flex-col gap-3 rounded-[16px] border border-white/10 bg-black/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <p className="break-all font-mono text-base tracking-[0.08em] text-white sm:text-lg">{code}</p>
                      <Button
                        type="button"
                        className="h-11 shrink-0"
                        onClick={async () => {
                          try {
                            await copyText(code);
                            await notifySuccess("Copied", "Code copied to clipboard.");
                          } catch {
                            await notifyError("Copy failed", "Could not copy");
                          }
                        }}
                      >
                        Copy code
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid gap-4">
              {reviewing.length === 0 ? (
                <div className="rounded-[26px] border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center text-white/45">
                  Inbox clear — no deposit proofs waiting.
                </div>
              ) : null}

              {reviewing.map((order) => (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-[26px] border border-white/12 bg-[#0c0c0c]"
                >
                  <div className="grid gap-0 lg:grid-cols-[minmax(220px,0.85fr)_1.15fr]">
                    {order.hasProof ? (
                      <a
                        href={`/api/admin/orders/${order.id}/proof`}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative block min-h-[200px] overflow-hidden bg-black lg:border-r lg:border-white/10"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/admin/orders/${order.id}/proof`}
                          alt={`Payment proof for ${order.number}`}
                          className="mx-auto max-h-[340px] w-full object-contain object-center"
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 py-3 text-center text-[10px] uppercase tracking-[0.16em] text-white/70">
                          Full size
                        </span>
                      </a>
                    ) : (
                      <div className="flex min-h-[180px] items-center justify-center border-b border-white/10 text-sm text-white/40 lg:border-b-0 lg:border-r">
                        No screenshot
                      </div>
                    )}

                    <div className="flex flex-col justify-between gap-5 p-5 sm:p-6">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-mono text-[11px] text-white/45">{order.number}</p>
                          <span className="rounded-full border border-amber-200/30 bg-amber-200/10 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.16em] text-amber-100">
                            Review
                          </span>
                        </div>
                        <p className="mt-2 display text-3xl sm:text-4xl">{formatBdt(order.total)}</p>
                        <p className="mt-3 text-sm leading-relaxed text-white/55">
                          {order.email}
                          {order.phone ? ` · ${order.phone}` : ""}
                          <br />
                          {order.title} × {order.quantity} · {formatWhen(order.createdAt)}
                        </p>
                        <div className="mt-4 rounded-2xl border border-white/10 bg-black/50 px-4 py-3">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">Proof</p>
                          <p className="mt-1.5 font-mono text-sm text-white/90">
                            {(order.paymentMethod ?? "pay").toUpperCase()} · {order.transactionId ?? "—"}
                          </p>
                          {order.proofSubmittedAt ? (
                            <p className="mt-1 text-xs text-white/40">
                              Uploaded {formatWhen(order.proofSubmittedAt)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        <Button
                          disabled={pending}
                          onClick={() =>
                            run(async () => {
                              const data = await post(`/api/admin/orders/${order.id}/approve`);
                              if (data.codes?.length) setUnlockedCodes(data.codes);
                              return data.message ?? "Approved. Code unlocked.";
                            })
                          }
                        >
                          Approve & show code
                        </Button>
                        {order.hasProof ? (
                          <a
                            href={`/api/admin/orders/${order.id}/proof`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-12 items-center rounded-full border border-white/20 px-5 text-sm text-white transition hover:border-white hover:bg-white/5"
                          >
                            Open image
                          </a>
                        ) : null}
                        <Button
                          variant="ghost"
                          disabled={pending}
                          onClick={() =>
                            run(async () => (await post(`/api/admin/orders/${order.id}/release`), "Hold released"))
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="grid content-start gap-4">
            <section className="relative overflow-hidden rounded-[28px] border border-white/12 bg-[#0c0c0c]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-[#ff2d2d]/18 blur-[50px]"
              />
              <div className="relative border-b border-white/10 px-5 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ff2d2d]">Stock</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">Notes on hand</h2>
                <p className="mt-1 text-sm text-white/45">Ready codes by face value.</p>
              </div>
              <ul className="relative divide-y divide-white/10">
                {snapshot.products.map((product) => {
                  const total = Math.max(product.stock + product.reserved + product.sold, 1);
                  const readyPct = Math.round((product.stock / total) * 100);
                  return (
                    <li key={product.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="display-soft text-2xl leading-none">
                            {formatBdt(product.faceValue)}
                          </p>
                          <p className="mt-1 text-xs text-white/40">{product.title}</p>
                        </div>
                        <p className="rounded-full border border-[#9fe870]/25 bg-[#9fe870]/10 px-2.5 py-1 font-mono text-[11px] text-[#9fe870]">
                          {product.stock} ready
                        </p>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-[#9fe870]"
                          style={{ width: `${readyPct}%` }}
                        />
                      </div>
                      <p className="mt-2 font-mono text-[11px] text-white/40">
                        {product.reserved} held · {product.sold} sold
                        {product.voided ? ` · ${product.voided} void` : ""}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="relative overflow-hidden rounded-[28px] border border-white/12 bg-[#0c0c0c] p-5">
              <div
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-1.5 bg-[#ff2d2d]"
              />
              <div className="pl-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Upload</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">Add codes</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/45">
                  One code per line. Encrypted at rest.
                </p>
                <label className="mt-5 block text-[10px] uppercase tracking-[0.16em] text-white/40" htmlFor="product">
                  Note
                </label>
                <select
                  id="product"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/15 bg-black px-3 py-2.5 text-sm text-white outline-none"
                >
                  {snapshot.products.map((product) => (
                    <option key={product.id} value={product.slug}>
                      {product.title}
                    </option>
                  ))}
                </select>
                <label className="mt-4 block text-[10px] uppercase tracking-[0.16em] text-white/40" htmlFor="codes">
                  Codes
                </label>
                <textarea
                  id="codes"
                  value={csv}
                  onChange={(event) => setCsv(event.target.value)}
                  rows={5}
                  className="mt-2 w-full rounded-xl border border-white/15 bg-black/60 p-3 font-mono text-xs text-white outline-none focus:border-white/40"
                  placeholder={"ICASH-1000-ABCD\nICASH-1000-EFGH"}
                />
                <Button
                  className="mt-4 w-full"
                  disabled={pending || !slug}
                  onClick={() =>
                    run(async () => {
                      const data = await post("/api/admin/codes", { productSlug: slug, csv });
                      setCsv("");
                      return `${data.added ?? 0} codes added`;
                    })
                  }
                >
                  Add to stock
                </Button>
              </div>
            </section>
          </aside>
        </div>

        <section className="mt-10 overflow-hidden rounded-[26px] border border-white/12 bg-[#0a0a0a]">
          <div className="flex items-end justify-between gap-3 border-b border-white/10 px-5 py-5 sm:px-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">History</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">All orders</h2>
            </div>
            <p className="text-sm text-white/40">{others.length}</p>
          </div>
          <ul className="divide-y divide-white/10">
            {others.length === 0 ? (
              <li className="px-5 py-8 text-sm text-white/45 sm:px-6">No other orders yet.</li>
            ) : null}
            {others.map((order) => {
              const revealed = revealedByOrder[order.id] ?? [];
              return (
                <li key={order.id} className="flex flex-col gap-4 px-5 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-[11px] text-white/45">{order.number}</p>
                      <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-white/65">
                        {order.status}
                      </span>
                    </div>
                    <p className="mt-1.5 display-soft text-2xl sm:text-3xl">{formatBdt(order.total)}</p>
                    <p className="mt-2 text-sm text-white/50">
                      {order.email}
                      {order.phone ? ` · ${order.phone}` : ""} · {order.title} × {order.quantity}
                    </p>
                    <p className="mt-1 text-xs text-white/35">{formatWhen(order.createdAt)}</p>
                    {order.transactionId ? (
                      <p className="mt-2 font-mono text-xs text-white/60">
                        {(order.paymentMethod ?? "pay").toUpperCase()} · {order.transactionId}
                      </p>
                    ) : null}
                    {revealed.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {revealed.map((code) => (
                          <div
                            key={code}
                            className="flex flex-col gap-2 rounded-xl border border-white/12 bg-white/[0.03] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <p className="break-all font-mono text-sm tracking-[0.08em] text-white">{code}</p>
                            <button
                              type="button"
                              className="inline-flex h-9 items-center justify-center rounded-full border border-white/20 px-3 text-xs text-white transition hover:bg-white hover:text-black"
                              onClick={async () => {
                                try {
                                  await copyText(code);
                                  await notifySuccess("Copied", "Code copied to clipboard.");
                                } catch {
                                  await notifyError("Copy failed", "Could not copy");
                                }
                              }}
                            >
                              Copy
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {order.hasProof ? (
                      <a
                        href={`/api/admin/orders/${order.id}/proof`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-11 items-center rounded-full border border-white/20 px-4 text-sm text-white transition hover:border-white hover:bg-white/5"
                      >
                        Screenshot
                      </a>
                    ) : null}
                    {order.hasCodes ? (
                      <Button
                        variant="ghost"
                        disabled={pending}
                        onClick={() =>
                          run(async () => {
                            const data = await post(`/api/admin/orders/${order.id}/reveal`);
                            if (data.codes?.length) {
                              setRevealedByOrder((prev) => ({ ...prev, [order.id]: data.codes! }));
                            }
                            return "Codes revealed for this session.";
                          })
                        }
                      >
                        Reveal
                      </Button>
                    ) : null}
                    {order.status === "PENDING" ? (
                      <Button
                        variant="ghost"
                        disabled={pending}
                        onClick={() =>
                          run(async () => (await post(`/api/admin/orders/${order.id}/release`), "Hold released"))
                        }
                      >
                        Release
                      </Button>
                    ) : null}
                    {order.status === "PAID" || order.status === "DELIVERED" ? (
                      <Button
                        variant="ghost"
                        disabled={pending}
                        onClick={() =>
                          run(async () => (await post(`/api/admin/orders/${order.id}/refund`), "Order refunded"))
                        }
                      >
                        Refund
                      </Button>
                    ) : null}
                    {order.status === "DELIVERED" ? (
                      <Button
                        variant="ghost"
                        disabled={pending}
                        onClick={() =>
                          run(async () => {
                            const data = await post(`/api/admin/orders/${order.id}/resend`);
                            return data.message ?? "Sent";
                          })
                        }
                      >
                        Email
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-8 overflow-hidden rounded-[26px] border border-white/12 bg-[#0a0a0a]">
          <div className="border-b border-white/10 px-5 py-5 sm:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Trail</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Audit</h2>
          </div>
          <ul className="divide-y divide-white/10">
            {snapshot.audit.length === 0 ? (
              <li className="px-5 py-8 text-sm text-white/45 sm:px-6">No owner actions yet.</li>
            ) : null}
            {snapshot.audit.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <p className="font-mono text-sm text-white/80">{entry.action}</p>
                <p className="text-xs text-white/40">
                  {entry.actor} · {formatWhen(entry.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Kpi({ label, value, hot = false }: { label: string; value: string; hot?: boolean }) {
  return (
    <div className="border-t border-white/10 px-5 py-4 first:border-t-0 sm:border-t-0 sm:border-l sm:border-white/10 sm:first:border-l-0 sm:px-6">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</p>
      <p className={`mt-1.5 display-soft text-3xl ${hot ? "text-[#ff2d2d]" : "text-white"}`}>{value}</p>
    </div>
  );
}

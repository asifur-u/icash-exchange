"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatBdt, formatWhen } from "@/lib/format";
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
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [unlockedCodes, setUnlockedCodes] = useState<string[]>([]);

  const reviewing = snapshot.orders.filter((order) => order.status === "REVIEWING");
  const others = snapshot.orders.filter((order) => order.status !== "REVIEWING");

  async function run(action: () => Promise<string>) {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      setMessage(await action());
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The desk refused that action");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-10 sm:px-8 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 sm:gap-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Owner</p>
          <h1 className="mt-3 display text-4xl sm:text-5xl">The desk</h1>
        </div>
        <button
          type="button"
          className="inline-flex h-11 items-center rounded-full border border-white/20 px-5 text-sm text-white/70 transition hover:border-white hover:text-white"
          onClick={async () => {
            await fetch("/api/admin/logout", { method: "POST" });
            window.location.assign("/admin/login");
          }}
        >
          Lock the desk
        </button>
      </div>

      <section className="mt-10 sm:mt-14">
        <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
          <h2 className="display text-2xl sm:text-3xl">Payment inbox</h2>
          <p className="text-sm text-white/45">{reviewing.length} waiting</p>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/50">
          User screenshots and TrxIDs land here. Approve to unlock the code — copy it and send to the buyer yourself.
        </p>

        {unlockedCodes.length > 0 ? (
          <div className="mt-6 rounded-[24px] border border-white/20 bg-white/[0.06] p-5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Just unlocked — copy & send</p>
            <div className="mt-3 grid gap-3">
              {unlockedCodes.map((code) => (
                <div
                  key={code}
                  className="flex flex-col gap-3 rounded-[18px] border border-white/15 bg-black/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="break-all font-mono text-lg tracking-[0.08em] text-white">{code}</p>
                  <Button
                    type="button"
                    className="h-11 shrink-0"
                    onClick={async () => {
                      try {
                        await copyText(code);
                        setMessage("Code copied");
                        setError(null);
                      } catch {
                        setError("Could not copy");
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

        <div className="mt-8 grid gap-5">
          {reviewing.length === 0 ? (
            <div className="rounded-[28px] border border-white/10 bg-white/[0.02] px-6 py-8 text-white/45">
              No deposit proofs waiting.
            </div>
          ) : null}
          {reviewing.map((order) => (
            <article key={order.id} className="premium-card overflow-hidden rounded-[24px] p-4 sm:rounded-[32px] sm:p-6">
              <div className="grid gap-5 lg:grid-cols-[minmax(240px,0.9fr)_1.1fr]">
                {order.proofFile ? (
                  <a
                    href={`/api/admin/orders/${order.id}/proof`}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative block overflow-hidden rounded-[22px] border border-white/15 bg-black"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/admin/orders/${order.id}/proof`}
                      alt={`Payment proof for ${order.number}`}
                      className="mx-auto max-h-[320px] w-full object-contain object-center"
                    />
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-3 text-center text-[11px] uppercase tracking-[0.16em] text-white/70 opacity-90 transition group-hover:text-white">
                      Tap for full size
                    </span>
                  </a>
                ) : (
                  <div className="flex min-h-[180px] items-center justify-center rounded-[22px] border border-dashed border-white/15 text-sm text-white/40">
                    No screenshot
                  </div>
                )}

                <div className="flex flex-col justify-between gap-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-mono text-xs text-white/50">{order.number}</p>
                      <span className="rounded-full border border-amber-200/30 bg-amber-200/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-100/90">
                        Needs review
                      </span>
                    </div>
                    <p className="mt-3 display text-3xl sm:text-4xl">{formatBdt(order.total)}</p>
                    <p className="mt-3 text-sm leading-relaxed text-white/55">
                      {order.email}
                      {order.phone ? ` · ${order.phone}` : ""}
                      <br />
                      {order.title} × {order.quantity} · {formatWhen(order.createdAt)}
                    </p>
                    <div className="mt-4 rounded-[20px] border border-white/12 bg-black/40 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">Payment proof</p>
                      <p className="mt-2 font-mono text-sm text-white/90">
                        {(order.paymentMethod ?? "pay").toUpperCase()} · {order.transactionId ?? "—"}
                      </p>
                      {order.proofSubmittedAt ? (
                        <p className="mt-2 text-xs text-white/45">Uploaded {formatWhen(order.proofSubmittedAt)}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
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
                    {order.proofFile ? (
                      <a
                        href={`/api/admin/orders/${order.id}/proof`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-12 items-center rounded-full border border-white/20 px-5 text-sm text-white transition hover:border-white hover:bg-white/5"
                      >
                        Open full image
                      </a>
                    ) : null}
                    <Button
                      variant="ghost"
                      disabled={pending}
                      onClick={() => run(async () => (await post(`/api/admin/orders/${order.id}/release`), "Hold released"))}
                    >
                      Reject / release
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="display text-3xl">Stock</h2>
        <ul className="mt-6 divide-y divide-white/10 border-y border-white/10">
          {snapshot.products.map((product) => (
            <li key={product.id} className="flex flex-col gap-2 py-5 sm:flex-row sm:items-baseline sm:justify-between">
              <div>
                <p className="display text-3xl">{formatBdt(product.faceValue)}</p>
                <p className="text-sm text-muted">{product.title}</p>
              </div>
              <p className="font-mono text-sm text-white/70">
                {product.stock} ready · {product.reserved} held · {product.sold} sold · {product.voided} void
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14 max-w-xl">
        <h2 className="display text-3xl">Upload codes</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          One code per line. Codes are encrypted in `.data` and reserved when a buyer checks out. Approve unlocks one for email + order page.
        </p>
        <label className="mt-6 block text-[11px] uppercase tracking-[0.18em] text-white/45" htmlFor="product">
          Note
        </label>
        <select
          id="product"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-white/15 bg-black px-4 py-3 text-white outline-none"
        >
          {snapshot.products.map((product) => (
            <option key={product.id} value={product.slug}>
              {product.title}
            </option>
          ))}
        </select>
        <label className="mt-6 block text-[11px] uppercase tracking-[0.18em] text-white/45" htmlFor="codes">
          Codes
        </label>
        <textarea
          id="codes"
          value={csv}
          onChange={(event) => setCsv(event.target.value)}
          rows={6}
          className="mt-2 w-full rounded-2xl border border-white/15 bg-transparent p-3 font-mono text-sm text-white outline-none focus:border-white/40"
          placeholder={"ICASH-1000-ABCD\nICASH-1000-EFGH"}
        />
        <Button
          className="mt-6"
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
      </section>

      <section className="mt-16">
        <h2 className="display text-3xl">All orders</h2>
        <ul className="mt-6 divide-y divide-white/10 border-y border-white/10">
          {others.length === 0 ? <li className="py-6 text-muted">No other orders yet.</li> : null}
          {others.map((order) => (
            <li key={order.id} className="flex flex-col gap-4 py-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="font-mono text-xs text-white/50">{order.number}</p>
                <p className="mt-1 display text-3xl">{formatBdt(order.total)}</p>
                <p className="mt-2 text-sm text-muted">
                  {order.email}
                  {order.phone ? ` · ${order.phone}` : ""} · {order.title} × {order.quantity} ·{" "}
                  {formatWhen(order.createdAt)}
                </p>
                {order.transactionId ? (
                  <p className="mt-2 font-mono text-sm text-white/70">
                    {(order.paymentMethod ?? "pay").toUpperCase()} · {order.transactionId}
                  </p>
                ) : null}
                {order.status === "DELIVERED" && order.codes && order.codes.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {order.codes.map((code) => (
                      <div
                        key={code}
                        className="flex flex-col gap-2 rounded-[16px] border border-white/15 bg-white/[0.04] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <p className="break-all font-mono text-sm tracking-[0.08em] text-white">{code}</p>
                        <button
                          type="button"
                          className="inline-flex h-10 items-center justify-center rounded-full border border-white/20 px-4 text-xs text-white transition hover:bg-white hover:text-black"
                          onClick={async () => {
                            try {
                              await copyText(code);
                              setMessage("Code copied");
                              setError(null);
                            } catch {
                              setError("Could not copy");
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
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[11px] uppercase tracking-[0.16em] text-white/70">{order.status}</span>
                {order.proofFile ? (
                  <a
                    href={`/api/admin/orders/${order.id}/proof`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-12 items-center rounded-full border border-white/20 px-5 text-sm text-white transition hover:border-white hover:bg-white/5"
                  >
                    Screenshot
                  </a>
                ) : null}
                {order.status === "PENDING" ? (
                  <Button
                    variant="ghost"
                    disabled={pending}
                    onClick={() => run(async () => (await post(`/api/admin/orders/${order.id}/release`), "Hold released"))}
                  >
                    Release hold
                  </Button>
                ) : null}
                {order.status === "PAID" || order.status === "DELIVERED" ? (
                  <Button
                    variant="ghost"
                    disabled={pending}
                    onClick={() => run(async () => (await post(`/api/admin/orders/${order.id}/refund`), "Order refunded"))}
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
                    Email buyer
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="display text-3xl">Audit</h2>
        <ul className="mt-6 divide-y divide-white/10 border-y border-white/10">
          {snapshot.audit.length === 0 ? <li className="py-6 text-muted">No owner actions yet.</li> : null}
          {snapshot.audit.map((entry) => (
            <li key={entry.id} className="flex flex-col gap-1 py-4 sm:flex-row sm:justify-between">
              <p className="font-mono text-sm text-white/80">{entry.action}</p>
              <p className="text-sm text-muted">
                {entry.actor} · {formatWhen(entry.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {message ? <p className="mt-8 text-sm text-white/80">{message}</p> : null}
      {error ? <p className="mt-8 text-sm text-[#e8c4b8]">{error}</p> : null}
    </div>
  );
}

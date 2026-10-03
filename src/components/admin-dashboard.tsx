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
  const data = (await response.json()) as { error?: { message?: string }; message?: string; added?: number };
  if (!response.ok) throw new Error(data.error?.message ?? "The desk refused that action");
  return data;
}

export function AdminDashboard({ snapshot }: { snapshot: AdminSnapshot }) {
  const router = useRouter();
  const [slug, setSlug] = useState(snapshot.products[0]?.slug ?? "");
  const [csv, setCsv] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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
    <div className="mx-auto w-full max-w-[1120px] px-5 py-12 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Owner</p>
          <h1 className="mt-3 display text-5xl">The desk</h1>
        </div>
        <button
          type="button"
          className="text-sm text-white/60 hover:text-gold"
          onClick={async () => {
            await fetch("/api/admin/logout", { method: "POST" });
            window.location.assign("/admin/login");
          }}
        >
          Lock the desk
        </button>
      </div>

      <section className="mt-14">
        <h2 className="display text-3xl">Stock</h2>
        <ul className="mt-6 divide-y divide-white/10 border-y border-white/10">
          {snapshot.products.map((product) => (
            <li key={product.id} className="flex flex-col gap-2 py-5 sm:flex-row sm:items-baseline sm:justify-between">
              <div>
                <p className="display text-3xl">{formatBdt(product.faceValue)}</p>
                <p className="text-sm text-muted">{product.title}</p>
              </div>
              <p className="font-mono text-sm text-gold">
                {product.stock} ready · {product.reserved} held · {product.sold} sold · {product.voided} void
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14 max-w-xl">
        <h2 className="display text-3xl">Upload codes</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          One code per line, or a CSV. Letters, numbers, and hyphens. Codes are encrypted before they are saved, and they are not shown here again.
        </p>
        <label className="mt-6 block text-[11px] uppercase tracking-[0.18em] text-gold" htmlFor="product">
          Note
        </label>
        <select
          id="product"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          className="mt-2 w-full border-b border-white/20 bg-black py-3 text-white outline-none"
        >
          {snapshot.products.map((product) => (
            <option key={product.id} value={product.slug}>
              {product.title}
            </option>
          ))}
        </select>
        <label className="mt-6 block text-[11px] uppercase tracking-[0.18em] text-gold" htmlFor="codes">
          Codes
        </label>
        <textarea
          id="codes"
          value={csv}
          onChange={(event) => setCsv(event.target.value)}
          rows={6}
          className="mt-2 w-full border border-white/15 bg-transparent p-3 font-mono text-sm text-white outline-none focus:border-gold"
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
        <h2 className="display text-3xl">Orders</h2>
        <ul className="mt-6 divide-y divide-white/10 border-y border-white/10">
          {snapshot.orders.length === 0 ? <li className="py-6 text-muted">No orders yet.</li> : null}
          {snapshot.orders.map((order) => (
            <li key={order.id} className="flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-mono text-xs text-gold">{order.number}</p>
                <p className="mt-1 display text-3xl">{formatBdt(order.total)}</p>
                <p className="text-sm text-muted">
                  {order.email} · {order.title} × {order.quantity} · {formatWhen(order.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[11px] uppercase tracking-[0.16em] text-white/70">{order.status}</span>
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
                    Resend
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
              <p className="font-mono text-sm text-gold">{entry.action}</p>
              <p className="text-sm text-muted">
                {entry.actor} · {formatWhen(entry.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {message ? <p className="mt-8 text-sm text-gold">{message}</p> : null}
      {error ? <p className="mt-8 text-sm text-[#e8c4b8]">{error}</p> : null}
    </div>
  );
}

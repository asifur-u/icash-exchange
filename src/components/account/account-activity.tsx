"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { AccountOrder } from "@/components/account/account-types";
import { useT } from "@/i18n/provider";
import { formatWhen } from "@/lib/format";

type ActivityItem = {
  id: string;
  at: string;
  title: string;
  body: string;
  href: string;
  tone: "neutral" | "warn" | "ok";
};

export function AccountActivity({ orders }: { orders: AccountOrder[] }) {
  const t = useT();

  const items = useMemo(() => {
    const rows: ActivityItem[] = [];
    for (const order of orders) {
      rows.push({
        id: `${order.id}-created`,
        at: order.createdAt,
        title: t("account.actCreated"),
        body: `${order.number} · ${order.title}`,
        href: `/account/orders/${order.id}?t=${order.token}`,
        tone: "neutral",
      });
      if (order.proofSubmittedAt) {
        rows.push({
          id: `${order.id}-proof`,
          at: order.proofSubmittedAt,
          title: t("account.actProof"),
          body: `${order.number} · ${t("account.actProofBody")}`,
          href: `/account/orders/${order.id}?t=${order.token}`,
          tone: "warn",
        });
      }
      if (order.status === "REVIEWING") {
        rows.push({
          id: `${order.id}-review`,
          at: order.proofSubmittedAt ?? order.createdAt,
          title: t("account.actReview"),
          body: `${order.number} · ${t("account.actReviewBody")}`,
          href: `/account/orders/${order.id}?t=${order.token}`,
          tone: "warn",
        });
      }
      if (order.deliveredAt || order.status === "DELIVERED") {
        rows.push({
          id: `${order.id}-delivered`,
          at: order.deliveredAt ?? order.createdAt,
          title: t("account.actDelivered"),
          body: `${order.number} · ${t("account.actDeliveredBody")}`,
          href: `/account/orders/${order.id}?t=${order.token}`,
          tone: "ok",
        });
      }
      if (order.status === "FAILED" || order.status === "REFUNDED") {
        rows.push({
          id: `${order.id}-closed`,
          at: order.createdAt,
          title: order.status === "REFUNDED" ? t("account.actRefunded") : t("account.actFailed"),
          body: `${order.number} · ${order.title}`,
          href: `/account/orders/${order.id}?t=${order.token}`,
          tone: "neutral",
        });
      }
    }
    return rows.sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }, [orders, t]);

  return (
    <div className="space-y-5 sm:space-y-6" style={{ color: "#09090b" }}>
      <header className="al-card p-5 sm:p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e11d2e]">
          {t("account.activity")}
        </p>
        <h1 className="mt-2 text-[clamp(1.9rem,5vw,2.8rem)] font-extrabold tracking-tight text-zinc-900">
          {t("account.activityTitle")}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500 sm:text-base">
          {t("account.activityLead")}
        </p>
      </header>

      <section className="al-card overflow-hidden">
        {items.length === 0 ? (
          <div className="px-5 py-12 text-center sm:px-6">
            <p className="text-lg font-bold text-zinc-900">{t("account.noActivityYet")}</p>
            <p className="mt-2 text-sm text-zinc-500">{t("account.noActivityLead")}</p>
            <Link href="/account/services" className="al-btn al-btn-primary mt-6 inline-flex">
              {t("account.openServices")}
            </Link>
          </div>
        ) : (
          <ul>
            {items.map((item, index) => (
              <li key={item.id} style={{ borderTop: index === 0 ? undefined : "1px solid #f4f4f5" }}>
                <Link
                  href={item.href}
                  className="flex gap-4 px-5 py-4 transition hover:bg-[#fafafa] sm:px-6"
                >
                  <span
                    aria-hidden
                    className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                      item.tone === "ok"
                        ? "bg-emerald-500"
                        : item.tone === "warn"
                          ? "bg-amber-400"
                          : "bg-zinc-300"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold tracking-tight text-zinc-900">{item.title}</p>
                    <p className="mt-1 text-sm text-zinc-500">{item.body}</p>
                    <p className="mt-1 text-xs text-zinc-400">{formatWhen(item.at)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

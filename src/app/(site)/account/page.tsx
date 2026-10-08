import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ContinueBuy } from "@/components/continue-buy";
import { Frame } from "@/components/frame";
import { LogoutButton } from "@/components/logout-button";
import { formatBdt, formatWhen } from "@/lib/format";
import { listOrdersForUser } from "@/lib/orders";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

const guide = [
  {
    title: "1. Pick a note",
    body: "Open Catalog or Buy. Choose a face value and quantity.",
  },
  {
    title: "2. Send the deposit",
    body: "Pay with bKash, Nagad, Rocket or bank. Add the transaction id and a clear screenshot.",
  },
  {
    title: "3. Wait for the desk",
    body: "The owner matches your proof. That usually takes a few minutes while they are online.",
  },
  {
    title: "4. Read the code",
    body: "When the order is delivered, open it from this dashboard and copy the code.",
  },
];

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth?next=/account");
  const orders = await listOrdersForUser(user.id);

  return (
    <section className="bg-black pb-16 pt-[calc(5.5rem+env(safe-area-inset-top))] sm:pb-24 sm:pt-32">
      <Frame>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Your desk</p>
            <h1 className="mt-4 display text-[clamp(2.4rem,10vw,4.8rem)]">
              Hello, <span className="accent-red">{user.name.split(" ")[0]}.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/60 sm:text-lg">
              {user.email} · {user.phone}
            </p>
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

        <div className="mt-12">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/40">How to buy</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {guide.map((item, index) => (
              <div key={item.title} className="rounded-[22px] border border-white/10 bg-[#0c0c0c] p-5">
                <p className="text-xs font-semibold text-[#ff2d2d]">0{index + 1}</p>
                <h2 className="mt-3 text-lg font-semibold tracking-tight">{item.title.replace(/^\d+\.\s*/, "")}</h2>
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
                    <p className="mt-1 text-sm text-white/45">{formatWhen(order.createdAt)}</p>
                  </div>
                  <span className="inline-flex h-10 items-center self-start rounded-full border border-white/20 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
                    {order.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Frame>
    </section>
  );
}

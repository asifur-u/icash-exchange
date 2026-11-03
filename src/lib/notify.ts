import { deliveryProviders, sendMail } from "@/lib/deliver";
import { formatBdt } from "@/lib/format";

const METHOD: Record<string, string> = { bkash: "bKash", nagad: "Nagad", rocket: "Rocket", bank: "Bank" };

function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
}

export function adminRecipients() {
  const list = (process.env.ADMIN_NOTIFY_EMAIL ?? process.env.SMTP_USER ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item));
  return [...new Set(list)];
}

type Row = [label: string, value: string | number | undefined];

function layout(input: { kicker: string; title: string; intro: string; rows?: Row[]; note?: string; cta?: { href: string; label: string } }) {
  const rows = (input.rows ?? []).filter(([, value]) => value !== undefined && value !== "");
  const table = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 0;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.45);">${esc(label)}</td>
          <td style="padding:10px 0;border-top:1px solid rgba(255,255,255,0.08);font-size:14px;color:#fff;text-align:right;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;word-break:break-all;">${esc(value)}</td>
        </tr>`,
    )
    .join("");
  const cta = input.cta
    ? `<a href="${esc(input.cta.href)}" style="display:inline-block;margin-top:24px;padding:13px 20px;border-radius:12px;background:#e11d2e;color:#fff;text-decoration:none;font-weight:600;font-size:14px;">${esc(input.cta.label)}</a>`
    : "";
  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#000;color:#fff;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
      <div style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#888;">${esc(input.kicker)}</div>
      <h1 style="margin:14px 0 8px;font-size:28px;line-height:1.15;font-weight:600;">${esc(input.title)}</h1>
      <p style="margin:0;color:#aaa;font-size:16px;line-height:1.55;">${esc(input.intro)}</p>
      <div style="margin-top:22px;border-radius:20px;border:1px solid rgba(255,255,255,0.14);background:#0c0c0c;overflow:hidden;">
        <div style="height:4px;background:#ff2d2d;"></div>
        <table role="presentation" style="width:100%;border-collapse:collapse;padding:0 20px;margin:6px 0;"><tbody>${table}</tbody></table>
      </div>
      ${cta}
      ${input.note ? `<p style="margin:24px 0 0;color:#666;font-size:13px;line-height:1.6;">${esc(input.note)}</p>` : ""}
    </div>
  </body>
</html>`;
  const text = [
    input.kicker,
    "",
    input.title,
    input.intro,
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    input.cta ? `\n${input.cta.label}: ${input.cta.href}` : "",
    input.note ? `\n${input.note}` : "",
  ]
    .filter((line) => line !== undefined)
    .join("\n");
  return { html, text };
}

async function quietly(kind: string, run: () => Promise<void>) {
  if (!deliveryProviders().email) return false;
  try {
    await run();
    return true;
  } catch (error) {
    console.error(`notify_${kind}_failed`, (error as Error)?.message);
    return false;
  }
}

async function toAdmin(kind: string, subject: string, body: Parameters<typeof layout>[0], replyTo?: string) {
  const to = adminRecipients();
  if (to.length === 0) return false;
  const admin = siteUrl() ? `${siteUrl()}/admin` : "";
  const mail = layout({ ...body, cta: admin ? { href: admin, label: "Open the admin desk" } : undefined });
  return quietly(kind, () => sendMail({ to, subject, ...mail, replyTo }));
}

export type BuyAlert = {
  number: string;
  name?: string;
  email: string;
  phone?: string;
  voucher: number;
  total: number;
  method?: string;
  transactionId?: string;
};

export function notifyAdminBuy(order: BuyAlert) {
  return toAdmin(
    "admin_buy",
    `New buy request ${order.number} · ${formatBdt(order.total)}`,
    {
      kicker: "iCash Exchange · admin",
      title: "New buy request.",
      intro: "A buyer sent money and a screenshot. Check the deposit, then approve it in the admin desk.",
      rows: [
        ["Order", order.number],
        ["Name", order.name],
        ["Email", order.email],
        ["Phone", order.phone],
        ["Voucher", formatBdt(order.voucher)],
        ["Paid", formatBdt(order.total)],
        ["Method", order.method ? (METHOD[order.method] ?? order.method) : undefined],
        ["TrxID", order.transactionId],
      ],
      note: "Approve only after the money is in your account. Approval generates the iCash voucher at once.",
    },
    order.email,
  );
}

export function notifyAdminSell(sell: {
  number: string;
  name: string;
  email: string;
  phone: string;
  faceValue: number;
  payout: number;
  method: string;
  payoutNumber: string;
}) {
  return toAdmin(
    "admin_sell",
    `New sell request ${sell.number} · ${formatBdt(sell.faceValue)}`,
    {
      kicker: "iCash Exchange · admin",
      title: "New sell request.",
      intro: "Someone wants to sell an iCash voucher. Redeem the code first, then pay them.",
      rows: [
        ["Request", sell.number],
        ["Name", sell.name],
        ["Email", sell.email],
        ["Phone", sell.phone],
        ["Voucher", formatBdt(sell.faceValue)],
        ["Pay them", formatBdt(sell.payout)],
        ["To", `${METHOD[sell.method] ?? sell.method} ${sell.payoutNumber}`],
      ],
      note: "The voucher code itself is only shown inside the admin desk.",
    },
    sell.email,
  );
}

export function notifyAdminIssueFailed(input: { number: string; email: string; amount: number; term: string; message: string }) {
  return toAdmin("admin_issue_failed", `iCash could not issue ${input.number}`, {
    kicker: "iCash Exchange · action needed",
    title: "Voucher was not generated.",
    intro: input.message,
    rows: [
      ["Order", input.number],
      ["Buyer", input.email],
      ["Voucher", formatBdt(input.amount)],
      ["iCash says", input.term],
    ],
    note: "The order stays paid. Fix the cause, then press Retry on the order in the iCash section.",
  });
}

export function notifyAdminLowBalance(input: { balance: number; currency: string; floor: number }) {
  return toAdmin("admin_low_balance", `iCash balance is low · ${input.balance} ${input.currency}`, {
    kicker: "iCash Exchange · balance",
    title: "Top up your iCash reseller balance.",
    intro: "New approvals will fail once the balance cannot cover a voucher.",
    rows: [
      ["Balance", `${input.balance} ${input.currency}`],
      ["Alert below", `${input.floor} ${input.currency}`],
    ],
  });
}

export function notifyBuyerReceived(order: BuyAlert) {
  const mail = layout({
    kicker: "iCash Exchange",
    title: "We got your request.",
    intro: "We are checking your payment now. Your voucher comes to this email as soon as it is approved.",
    rows: [
      ["Order", order.number],
      ["Voucher", formatBdt(order.voucher)],
      ["You paid", formatBdt(order.total)],
      ["TrxID", order.transactionId],
    ],
    note: "Did not send this? Reply to this email.",
  });
  return quietly("buyer_received", () =>
    sendMail({ to: order.email, subject: `Request received · ${order.number}`, ...mail }),
  );
}

export function notifyBuyerIssued(input: { email: string; number: string; amount: number; masked: string[] }) {
  const mail = layout({
    kicker: "iCash Exchange",
    title: "Payment approved.",
    intro: "Your iCash voucher was generated. iCash One sends the full code in a separate email to this address.",
    rows: [
      ["Order", input.number],
      ["Voucher", formatBdt(input.amount)],
      ...input.masked.map((code, index): Row => [input.masked.length > 1 ? `Code ${index + 1}` : "Code", code]),
    ],
    note: "Check spam or promotions if the iCash email is not in your inbox within a few minutes. Reply here if it never arrives.",
  });
  return quietly("buyer_issued", () =>
    sendMail({ to: input.email, subject: `Approved · ${input.number}`, ...mail }),
  );
}

export function notifySellerSettled(input: {
  email: string;
  number: string;
  status: "PAID" | "REJECTED";
  faceValue: number;
  payout: number;
  method: string;
  payoutNumber: string;
}) {
  const paid = input.status === "PAID";
  const mail = layout({
    kicker: "iCash Exchange",
    title: paid ? "Your sale is paid." : "We could not accept this voucher.",
    intro: paid
      ? "We sent the money to the number you gave us."
      : "The code was used, invalid, or did not match the amount. Reply to this email if you think this is wrong.",
    rows: [
      ["Request", input.number],
      ["Voucher", formatBdt(input.faceValue)],
      ...(paid
        ? ([
            ["Sent", formatBdt(input.payout)],
            ["To", `${METHOD[input.method] ?? input.method} ${input.payoutNumber}`],
          ] as Row[])
        : []),
    ],
  });
  return quietly("seller_settled", () =>
    sendMail({ to: input.email, subject: `${paid ? "Paid" : "Declined"} · ${input.number}`, ...mail }),
  );
}

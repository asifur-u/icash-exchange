import nodemailer from "nodemailer";
import { DeskError } from "@/lib/errors";
import { formatBdt } from "@/lib/format";

type DeliveryPayload = {
  email: string;
  phone?: string;
  number: string;
  title?: string;
  total?: number;
  codes: string[];
};

function smtpReady() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.DELIVERY_FROM,
  );
}

function resendReady() {
  return Boolean(process.env.RESEND_API_KEY && process.env.DELIVERY_FROM);
}

function providers() {
  return {
    email: smtpReady() || resendReady(),
    sms: Boolean(process.env.SMS_API_KEY && process.env.SMS_API_URL),
  };
}

export function deliveryProviders() {
  return providers();
}

function emailText(payload: DeliveryPayload) {
  return [
    "iCash Exchange",
    "",
    `Order ${payload.number}`,
    payload.title ? `Note: ${payload.title}` : "",
    payload.total != null ? `Value: ${formatBdt(payload.total)}` : "",
    "",
    "Your voucher code is ready. Keep it private.",
    "",
    ...payload.codes.map((code, index) => `Code ${index + 1}: ${code}`),
    "",
    "Select the code and copy it. Open your order page anytime for the same code.",
    "",
    "— iCash Exchange desk",
  ]
    .filter(Boolean)
    .join("\n");
}

function emailHtml(payload: DeliveryPayload) {
  const title = payload.title ?? "Digital note";
  const amount = payload.total != null ? formatBdt(payload.total) : "";
  const cards = payload.codes
    .map(
      (code) => `
      <div style="margin:20px 0 0;border-radius:22px;overflow:hidden;border:1px solid rgba(255,255,255,0.18);background:linear-gradient(155deg,#1c1c1c 0%,#080808 50%,#141414 100%);">
        <div style="height:4px;background:#ff2d2d;"></div>
        <div style="padding:22px 22px 18px;">
          <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.45);">iCash gift voucher</div>
          <div style="margin-top:10px;font-size:13px;color:rgba(255,255,255,0.55);">${title}${amount ? ` · ${amount}` : ""}</div>
          <div style="margin-top:18px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.4);">Voucher code</div>
          <div style="margin-top:8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:24px;line-height:1.3;color:#fff;letter-spacing:0.1em;word-break:break-all;">${code}</div>
          <div style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.12);font-size:12px;color:rgba(255,255,255,0.45);">
            Select the code above and copy it. Keep this email private.
          </div>
        </div>
      </div>`,
    )
    .join("");

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#000;color:#fff;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
      <div style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#888;">iCash Exchange</div>
      <h1 style="margin:14px 0 8px;font-size:30px;line-height:1.15;font-weight:600;">Payment approved.</h1>
      <p style="margin:0;color:#aaa;font-size:16px;line-height:1.55;">
        Order <strong style="color:#fff;">${payload.number}</strong> is confirmed. Your digital voucher is ready below.
      </p>
      ${cards}
      <p style="margin:28px 0 0;color:#666;font-size:13px;line-height:1.6;">
        You can also open your signed order page to copy the code again anytime.
      </p>
    </div>
  </body>
</html>`;
}

async function sendViaSmtp(payload: DeliveryPayload) {
  const port = Number(process.env.SMTP_PORT ?? "465");
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.DELIVERY_FROM,
    to: payload.email,
    subject: `Your iCash Exchange voucher · ${payload.number}`,
    text: emailText(payload),
    html: emailHtml(payload),
  });
}

async function sendViaResend(payload: DeliveryPayload) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.DELIVERY_FROM,
      to: payload.email,
      subject: `Your iCash Exchange voucher · ${payload.number}`,
      text: emailText(payload),
      html: emailHtml(payload),
    }),
  });
  if (!response.ok) throw new DeskError("EMAIL_FAILED", "Email was not accepted");
}

async function sendEmail(payload: DeliveryPayload) {
  if (smtpReady()) {
    await sendViaSmtp(payload);
    return;
  }
  if (resendReady()) {
    await sendViaResend(payload);
    return;
  }
  throw new DeskError("EMAIL_FAILED", "No email provider is configured");
}

async function sendSms(payload: DeliveryPayload) {
  const endpoint = process.env.SMS_API_URL;
  if (!endpoint) return;
  const url = new URL(endpoint);
  if (url.protocol !== "https:") {
    throw new DeskError("BAD_INPUT", "SMS_API_URL must use https");
  }
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SMS_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: payload.phone,
      text: `iCash Exchange ${payload.number}: ${payload.codes.join(", ")}`,
    }),
  });
  if (!response.ok) throw new DeskError("EMAIL_FAILED", "SMS was not accepted");
}

export async function dispatchCodes(payload: DeliveryPayload) {
  const available = providers();
  const result = { email: false, sms: false };
  if (available.email) {
    await sendEmail(payload);
    result.email = true;
  }
  if (available.sms && payload.phone) {
    await sendSms(payload);
    result.sms = true;
  }
  return result;
}

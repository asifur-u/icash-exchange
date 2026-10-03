import { DeskError } from "@/lib/errors";

type DeliveryPayload = {
  email: string;
  phone?: string;
  number: string;
  codes: string[];
};

function providers() {
  return {
    email: Boolean(process.env.RESEND_API_KEY && process.env.DELIVERY_FROM),
    sms: Boolean(process.env.SMS_API_KEY && process.env.SMS_API_URL),
  };
}

export function deliveryProviders() {
  return providers();
}

async function sendEmail(payload: DeliveryPayload) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.DELIVERY_FROM,
      to: payload.email,
      subject: `Your iCash Exchange code · ${payload.number}`,
      text: [`Order ${payload.number}`, "", ...payload.codes].join("\n"),
    }),
  });
  if (!response.ok) throw new DeskError("EMAIL_FAILED", "Email was not accepted");
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

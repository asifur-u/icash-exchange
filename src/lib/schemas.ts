import { z } from "zod";

export const checkoutSchema = z.object({
  productSlug: z.string().trim().min(1).max(80),
  quantity: z.number().int().min(1).max(5),
  email: z.string().trim().email("Enter a valid email").max(160),
  phone: z.string().trim().regex(/^01\d{9}$/, "Use an 11-digit mobile number starting with 01"),
});

export const confirmSchema = z.object({
  orderId: z.string().trim().min(1).max(200),
  token: z.string().trim().min(1).max(500),
});

export const paymentProofSchema = z.object({
  orderId: z.string().trim().min(1).max(200),
  token: z.string().trim().min(1).max(500),
  method: z.enum(["bkash", "nagad", "rocket", "bank"]),
  transactionId: z.string().trim().min(4).max(80),
  proofDataUrl: z.string().trim().min(40).max(3_800_000),
});

export const loginSchema = z.object({
  password: z.string().min(1, "Enter the owner password").max(200),
});

export const uploadSchema = z.object({
  productSlug: z.string().trim().min(1).max(80),
  csv: z.string().trim().min(1, "Add at least one code").max(50_000),
});

export const webhookSchema = z.object({
  id: z.string().trim().min(1).max(200),
  orderId: z.string().trim().min(1).max(200),
  paymentRef: z.string().trim().min(1).max(200),
  status: z.string().trim().min(1).max(40),
});

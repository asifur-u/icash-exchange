import { z } from "zod";

const person = {
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().email("Enter a valid email").max(160),
  phone: z.string().trim().regex(/^01\d{9}$/, "Use an 11-digit mobile number starting with 01"),
  amount: z.number().int().min(1).max(1_000_000),
  method: z.enum(["bkash", "nagad", "rocket", "bank"]),
};

export const deskRequestSchema = z.discriminatedUnion("intent", [
  z.object({
    intent: z.literal("buy"),
    ...person,
    transactionId: z.string().trim().min(4).max(80),
    proofDataUrl: z.string().trim().min(40).max(3_800_000),
  }),
  z.object({
    intent: z.literal("sell"),
    ...person,
    payoutNumber: z.string().trim().min(6, "Enter the number that receives the taka").max(30),
    voucherCode: z.string().trim().min(4, "Enter the voucher code").max(80),
  }),
]);

export const checkoutSchema = z.object({
  productSlug: z.string().trim().min(1).max(80),
  quantity: z.number().int().min(1).max(5),
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

export const adminLoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(160),
  password: z.string().min(1, "Enter your password").max(128),
});

const strongPassword = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(128, "Password is too long")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

export const adminAccountSchema = z.object({
  name: z.string().trim().min(2, "Enter the owner name").max(80),
  email: z.string().trim().email("Enter a valid email").max(160),
  phone: z.string().trim().regex(/^01\d{9}$/, "Use an 11-digit mobile number starting with 01"),
  password: strongPassword,
});

export const userRegisterSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().email("Enter a valid email").max(160),
  phone: z.string().trim().regex(/^01\d{9}$/, "Use an 11-digit mobile number starting with 01"),
  password: strongPassword,
});

export const userLoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(160),
  password: z.string().min(1, "Enter your password").max(128),
});

export const userProfileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  phone: z.string().trim().regex(/^01\d{9}$/, "Use an 11-digit mobile number starting with 01"),
});

export const userPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password").max(128),
  nextPassword: strongPassword,
});

export const userAvatarSchema = z.object({
  avatarDataUrl: z.string().trim().min(40).max(3_800_000),
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

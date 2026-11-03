-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'ADMIN');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'REVIEWING', 'PAID', 'DELIVERED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CodeStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'VOID');

-- CreateEnum
CREATE TYPE "SellStatus" AS ENUM ('OPEN', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "IssuanceStatus" AS ENUM ('ISSUING', 'ISSUED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('bkash', 'nagad', 'rocket', 'bank');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "avatarUrl" TEXT,
    "imageKitFileId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "blurb" TEXT NOT NULL,
    "faceValue" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherCode" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "cipher" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "status" "CodeStatus" NOT NULL DEFAULT 'AVAILABLE',
    "orderId" TEXT,
    "reservedAt" TIMESTAMPTZ(3),
    "soldAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoucherCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "userId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "productId" TEXT,
    "voucher" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "paymentRef" TEXT,
    "paymentMethod" "PaymentMethod",
    "transactionId" TEXT,
    "proofFile" TEXT,
    "proofSubmittedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMPTZ(3),
    "deliveredAt" TIMESTAMPTZ(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Issuance" (
    "orderId" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "status" "IssuanceStatus" NOT NULL,
    "delivery" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMPTZ(3) NOT NULL,
    "issuedAt" TIMESTAMPTZ(3),
    "uuid" TEXT,
    "currency" TEXT,
    "amount" INTEGER,
    "cost" DECIMAL(18,6),
    "exchangeRate" DECIMAL(18,8),
    "codeCiphers" TEXT[],
    "masked" TEXT[],
    "error" TEXT,
    "errorMessage" TEXT,

    CONSTRAINT "Issuance_pkey" PRIMARY KEY ("orderId")
);

-- CreateTable
CREATE TABLE "Sell" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "faceValue" INTEGER NOT NULL,
    "payout" INTEGER NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "payoutNumber" TEXT NOT NULL,
    "voucherCipher" TEXT NOT NULL,
    "voucherHash" TEXT NOT NULL,
    "status" "SellStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMPTZ(3),

    CONSTRAINT "Sell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Counter" (
    "id" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "Counter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "VoucherCode_hash_key" ON "VoucherCode"("hash");

-- CreateIndex
CREATE INDEX "VoucherCode_productId_status_idx" ON "VoucherCode"("productId", "status");

-- CreateIndex
CREATE INDEX "VoucherCode_orderId_idx" ON "VoucherCode"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymentRef_key" ON "Order"("paymentRef");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_email_status_idx" ON "Order"("email", "status");

-- CreateIndex
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Issuance_ref_key" ON "Issuance"("ref");

-- CreateIndex
CREATE INDEX "Issuance_status_idx" ON "Issuance"("status");

-- CreateIndex
CREATE INDEX "Issuance_issuedAt_idx" ON "Issuance"("issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Sell_number_key" ON "Sell"("number");

-- CreateIndex
CREATE INDEX "Sell_status_createdAt_idx" ON "Sell"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Sell_voucherHash_idx" ON "Sell"("voucherHash");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "VoucherCode" ADD CONSTRAINT "VoucherCode_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherCode" ADD CONSTRAINT "VoucherCode_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issuance" ADD CONSTRAINT "Issuance_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Desk rules Prisma cannot express in the schema.
-- A voucher code can sit on only one live sell request (rejected ones may be resubmitted).
CREATE UNIQUE INDEX "Sell_voucherHash_active_key" ON "Sell"("voucherHash") WHERE "status" <> 'REJECTED';
-- A deposit transaction ID can back only one live order.
CREATE UNIQUE INDEX "Order_transactionId_active_key" ON "Order"("transactionId") WHERE "transactionId" IS NOT NULL AND "status" <> 'FAILED';
-- Running reference numbers start at IX-1042 / SX-1042.
INSERT INTO "Counter" ("id", "value") VALUES ('desk', 1042);

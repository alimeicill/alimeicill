-- CreateEnum
CREATE TYPE "CashAccountType" AS ENUM ('CASH', 'BANK');

-- CreateEnum
CREATE TYPE "CashTxType" AS ENUM ('OPENING', 'DUES_COLLECTION', 'OTHER_INCOME', 'EXPENSE', 'VENDOR_PAYMENT', 'TRANSFER_IN', 'TRANSFER_OUT');

-- CreateTable
CREATE TABLE "CashAccount" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CashAccountType" NOT NULL,
    "bankName" TEXT,
    "iban" TEXT,
    "holderName" TEXT,
    "showToResidents" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashTransaction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" "CashTxType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "paymentId" TEXT,
    "transferId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CashAccount_tenantId_idx" ON "CashAccount"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "CashTransaction_paymentId_key" ON "CashTransaction"("paymentId");

-- CreateIndex
CREATE INDEX "CashTransaction_tenantId_date_idx" ON "CashTransaction"("tenantId", "date");

-- CreateIndex
CREATE INDEX "CashTransaction_accountId_date_idx" ON "CashTransaction"("accountId", "date");

-- CreateIndex
CREATE INDEX "CashTransaction_transferId_idx" ON "CashTransaction"("transferId");

-- AddForeignKey
ALTER TABLE "CashAccount" ADD CONSTRAINT "CashAccount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashTransaction" ADD CONSTRAINT "CashTransaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashTransaction" ADD CONSTRAINT "CashTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "CashAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashTransaction" ADD CONSTRAINT "CashTransaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;


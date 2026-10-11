-- AlterTable
ALTER TABLE "Due" ADD COLUMN     "description" TEXT,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "paidAmount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "lateInterest" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);

-- CreateIndex
CREATE INDEX "Due_tenantId_period_idx" ON "Due"("tenantId", "period");

-- CreateIndex
CREATE INDEX "Due_apartmentId_idx" ON "Due"("apartmentId");


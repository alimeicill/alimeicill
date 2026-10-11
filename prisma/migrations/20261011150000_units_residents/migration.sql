-- AlterEnum
ALTER TYPE "ApartmentType" ADD VALUE 'PARKING';

-- AlterTable
ALTER TABLE "Apartment" ADD COLUMN     "emergencyName" TEXT,
ADD COLUMN     "emergencyPhone" TEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Apartment_blockId_number_key" ON "Apartment"("blockId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "ApartmentUser_apartmentId_userId_key" ON "ApartmentUser"("apartmentId", "userId");


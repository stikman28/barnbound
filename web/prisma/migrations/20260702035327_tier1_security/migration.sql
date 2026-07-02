-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" TIMESTAMP(3),
ADD COLUMN     "verifyCode" TEXT,
ADD COLUMN     "verifyCodeExpiry" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "BusinessClaimRequest" (
    "id" TEXT NOT NULL,
    "proof" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "businessId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "BusinessClaimRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessClaimRequest_status_idx" ON "BusinessClaimRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessClaimRequest_businessId_userId_key" ON "BusinessClaimRequest"("businessId", "userId");

-- AddForeignKey
ALTER TABLE "BusinessClaimRequest" ADD CONSTRAINT "BusinessClaimRequest_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessClaimRequest" ADD CONSTRAINT "BusinessClaimRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

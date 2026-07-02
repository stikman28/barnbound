-- CreateEnum
CREATE TYPE "WantedStatus" AS ENUM ('OPEN', 'FULFILLED', 'CLOSED');

-- CreateTable
CREATE TABLE "WantedAd" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL,
    "budgetCents" INTEGER,
    "city" TEXT,
    "status" "WantedStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "buyerId" TEXT NOT NULL,

    CONSTRAINT "WantedAd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WantedResponse" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wantedAdId" TEXT NOT NULL,
    "responderId" TEXT NOT NULL,

    CONSTRAINT "WantedResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WantedAd_status_idx" ON "WantedAd"("status");

-- CreateIndex
CREATE INDEX "WantedAd_buyerId_idx" ON "WantedAd"("buyerId");

-- CreateIndex
CREATE INDEX "WantedResponse_responderId_idx" ON "WantedResponse"("responderId");

-- CreateIndex
CREATE UNIQUE INDEX "WantedResponse_wantedAdId_responderId_key" ON "WantedResponse"("wantedAdId", "responderId");

-- AddForeignKey
ALTER TABLE "WantedAd" ADD CONSTRAINT "WantedAd_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WantedResponse" ADD CONSTRAINT "WantedResponse_wantedAdId_fkey" FOREIGN KEY ("wantedAdId") REFERENCES "WantedAd"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WantedResponse" ADD CONSTRAINT "WantedResponse_responderId_fkey" FOREIGN KEY ("responderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

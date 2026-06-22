-- CreateEnum
CREATE TYPE "BusinessPlan" AS ENUM ('FREE', 'STARTER', 'PRO', 'PREMIER');

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "plan" "BusinessPlan" NOT NULL DEFAULT 'FREE';

-- CreateIndex
CREATE INDEX "Business_ownerId_idx" ON "Business"("ownerId");

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

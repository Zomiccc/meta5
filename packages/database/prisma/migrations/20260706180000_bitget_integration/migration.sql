-- AlterEnum
ALTER TYPE "DepositStatus" ADD VALUE 'expired';

-- DropIndex
DROP INDEX "Deposit_nowPaymentsId_idx";

-- AlterTable
ALTER TABLE "Deposit" DROP COLUMN "nowPaymentsId",
ADD COLUMN "bitgetTxId" TEXT,
ADD COLUMN "uniqueAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Withdrawal" ADD COLUMN "bitgetTxId" TEXT,
ADD COLUMN "clientWalletAddress" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "Deposit_bitgetTxId_idx" ON "Deposit"("bitgetTxId");

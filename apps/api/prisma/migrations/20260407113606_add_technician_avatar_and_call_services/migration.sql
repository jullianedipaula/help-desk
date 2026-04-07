/*
  Warnings:

  - You are about to drop the column `serviceId` on the `Call` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Call" DROP CONSTRAINT "Call_serviceId_fkey";

-- AlterTable
ALTER TABLE "Call" DROP COLUMN "serviceId";

-- AlterTable
ALTER TABLE "Technician" ADD COLUMN     "avatarUrl" TEXT;

-- CreateTable
CREATE TABLE "CallService" (
    "callId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "CallService_pkey" PRIMARY KEY ("callId","serviceId")
);

-- AddForeignKey
ALTER TABLE "CallService" ADD CONSTRAINT "CallService_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallService" ADD CONSTRAINT "CallService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

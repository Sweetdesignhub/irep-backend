/*
  Warnings:

  - You are about to drop the column `versions` on the `Rule` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Rule" DROP COLUMN "versions";

-- CreateTable
CREATE TABLE "Version" (
    "id" SERIAL NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "ruleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Version_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Version" ADD CONSTRAINT "Version_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

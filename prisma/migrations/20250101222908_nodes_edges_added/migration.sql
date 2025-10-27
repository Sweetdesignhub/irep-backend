/*
  Warnings:

  - Added the required column `ruleId` to the `Edge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ruleId` to the `Node` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Edge" ADD COLUMN     "ruleId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Node" ADD COLUMN     "ruleId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Edge" ADD CONSTRAINT "Edge_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

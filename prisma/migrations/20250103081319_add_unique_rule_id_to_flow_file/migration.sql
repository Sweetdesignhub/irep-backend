/*
  Warnings:

  - The primary key for the `FlowFile` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `FlowFile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[ruleId]` on the table `FlowFile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `FlowFile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FlowFile" DROP CONSTRAINT "FlowFile_pkey",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "FlowFile_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "FlowFile_ruleId_key" ON "FlowFile"("ruleId");

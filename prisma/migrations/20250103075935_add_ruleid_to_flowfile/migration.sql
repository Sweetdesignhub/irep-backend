/*
  Warnings:

  - Added the required column `ruleId` to the `FlowFile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FlowFile" ADD COLUMN     "ruleId" TEXT NOT NULL;

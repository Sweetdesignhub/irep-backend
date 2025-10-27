/*
  Warnings:

  - You are about to drop the column `termsAccepted` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Dataset" ADD COLUMN     "termsAccepted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "termsAccepted";

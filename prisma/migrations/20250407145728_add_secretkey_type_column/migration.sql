/*
  Warnings:

  - Added the required column `type` to the `SecretKey` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SecretKey" ADD COLUMN     "type" TEXT NOT NULL;

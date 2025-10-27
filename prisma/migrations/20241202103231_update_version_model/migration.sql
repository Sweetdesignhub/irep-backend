/*
  Warnings:

  - You are about to drop the column `version` on the `Version` table. All the data in the column will be lost.
  - Added the required column `data` to the `Version` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Version" DROP COLUMN "version",
ADD COLUMN     "data" JSONB NOT NULL,
ADD COLUMN     "flowInput" JSONB,
ADD COLUMN     "versionName" TEXT NOT NULL DEFAULT '1.0';

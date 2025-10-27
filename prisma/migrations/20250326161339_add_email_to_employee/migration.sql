/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `EmployeeAppraisal` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `EmployeeAppraisal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EmployeeAppraisal" ADD COLUMN     "email" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeAppraisal_email_key" ON "EmployeeAppraisal"("email");

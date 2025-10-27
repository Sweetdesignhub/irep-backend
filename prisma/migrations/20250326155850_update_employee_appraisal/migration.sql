-- CreateTable
CREATE TABLE "EmployeeAppraisal" (
    "employee_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "job_role" TEXT NOT NULL,
    "self_score" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "manager_score" TEXT NOT NULL,
    "goal_score" DECIMAL(65,30) NOT NULL DEFAULT 0.0,

    CONSTRAINT "EmployeeAppraisal_pkey" PRIMARY KEY ("employee_id")
);

-- CreateTable
CREATE TABLE "SecretKey" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "SecretKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SecretKey_userId_key" ON "SecretKey"("userId");

-- AddForeignKey
ALTER TABLE "SecretKey" ADD CONSTRAINT "SecretKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

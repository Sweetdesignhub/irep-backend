-- -- AlterTable
-- -- ALTER TABLE "Organization" ADD COLUMN     "deletedAt" TIMESTAMP(3),
-- -- ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- -- CreateTable
-- CREATE TABLE "Teams" (
--     "id" SERIAL NOT NULL,
--     "name" TEXT NOT NULL,
--     "description" TEXT NOT NULL,
--     "organizationId" INTEGER NOT NULL,
--     "ownerId" INTEGER NOT NULL,
--     "deletedAt" TIMESTAMP(3),
--     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
--     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     "updatedAt" TIMESTAMP(3) NOT NULL,

--     CONSTRAINT "Teams_pkey" PRIMARY KEY ("id")
-- );

-- -- CreateTable
-- CREATE TABLE "_TeamUsers" (
--     "A" INTEGER NOT NULL,
--     "B" INTEGER NOT NULL
-- );

-- -- CreateIndex
-- CREATE UNIQUE INDEX "_TeamUsers_AB_unique" ON "_TeamUsers"("A", "B");

-- -- CreateIndex
-- CREATE INDEX "_TeamUsers_B_index" ON "_TeamUsers"("B");

-- -- AddForeignKey
-- ALTER TABLE "Teams" ADD CONSTRAINT "Teams_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE "Teams" ADD CONSTRAINT "Teams_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE "_TeamUsers" ADD CONSTRAINT "_TeamUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "Teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE "_TeamUsers" ADD CONSTRAINT "_TeamUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

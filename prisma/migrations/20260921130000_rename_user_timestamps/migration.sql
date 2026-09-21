-- Rename timestamp columns to match the Prisma model fields.
ALTER TABLE "User" RENAME COLUMN "CreatedAt" TO "createdAt";
ALTER TABLE "User" RENAME COLUMN "UpdatedAt" TO "updatedAt";
/*
  Warnings:

  - You are about to drop the column `name` on the `ecommerce_users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ecommerce_users" DROP COLUMN "name",
ADD COLUMN     "fullname" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "lastname" TEXT NOT NULL DEFAULT '';

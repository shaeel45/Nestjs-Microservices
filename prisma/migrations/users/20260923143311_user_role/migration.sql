-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'ADMIN');

-- AlterTable
ALTER TABLE "ecommerce_users" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'CUSTOMER';

/*
  Warnings:

  - The `colors` column on the `ecommerce_products` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `sizes` column on the `ecommerce_products` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ecommerce_products" ADD COLUMN     "details" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "rating" JSONB DEFAULT '{"rate": 0, "count": 0}',
ADD COLUMN     "review" JSONB DEFAULT '[]',
DROP COLUMN "colors",
ADD COLUMN     "colors" TEXT[] DEFAULT ARRAY[]::TEXT[],
DROP COLUMN "sizes",
ADD COLUMN     "sizes" TEXT[] DEFAULT ARRAY[]::TEXT[];

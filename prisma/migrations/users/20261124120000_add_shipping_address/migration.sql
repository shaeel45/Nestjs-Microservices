-- AlterTable
ALTER TABLE "ecommerce_users"
ADD COLUMN     "addressStreet" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "addressCity" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "addressState" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "addressPostalCode" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "addressCountry" TEXT NOT NULL DEFAULT 'United States';

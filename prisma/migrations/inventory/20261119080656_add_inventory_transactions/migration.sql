-- CreateEnum
CREATE TYPE "InventoryTransactionType" AS ENUM ('RESTOCK', 'SALE', 'RETURN', 'DAMAGE', 'ADJUSTMENT');

-- AlterTable
ALTER TABLE "ecommerce_inventory" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "ecommerce_inventory_transactions" (
    "id" SERIAL NOT NULL,
    "inventoryItemId" INTEGER NOT NULL,
    "type" "InventoryTransactionType" NOT NULL,
    "changeAmount" INTEGER NOT NULL,
    "quantityBefore" INTEGER NOT NULL,
    "quantityAfter" INTEGER NOT NULL,
    "performedBy" TEXT,
    "reason" TEXT,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ecommerce_inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ecommerce_inventory_transactions_inventoryItemId_createdAt_idx" ON "ecommerce_inventory_transactions"("inventoryItemId", "createdAt");

-- CreateIndex
CREATE INDEX "ecommerce_inventory_transactions_type_createdAt_idx" ON "ecommerce_inventory_transactions"("type", "createdAt");

-- CreateIndex
CREATE INDEX "ecommerce_inventory_transactions_referenceId_idx" ON "ecommerce_inventory_transactions"("referenceId");

-- CreateIndex
CREATE INDEX "ecommerce_inventory_warehouse_idx" ON "ecommerce_inventory"("warehouse");

-- CreateIndex
CREATE INDEX "ecommerce_inventory_quantity_idx" ON "ecommerce_inventory"("quantity");

-- AddForeignKey
ALTER TABLE "ecommerce_inventory_transactions" ADD CONSTRAINT "ecommerce_inventory_transactions_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "ecommerce_inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

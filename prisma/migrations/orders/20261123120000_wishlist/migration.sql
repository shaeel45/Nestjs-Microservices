-- CreateTable
CREATE TABLE "ecommerce_wishlists" (
    "id" SERIAL NOT NULL,
    "wishlistToken" TEXT NOT NULL,
    "customerId" TEXT,
    "customerEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_wishlist_items" (
    "id" SERIAL NOT NULL,
    "wishlistId" INTEGER NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "image" TEXT,
    "category" TEXT,
    "itemKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ecommerce_wishlists_wishlistToken_key" ON "ecommerce_wishlists"("wishlistToken");

-- CreateIndex
CREATE INDEX "ecommerce_wishlists_customerId_idx" ON "ecommerce_wishlists"("customerId");

-- CreateIndex
CREATE INDEX "ecommerce_wishlists_updatedAt_idx" ON "ecommerce_wishlists"("updatedAt");

-- CreateIndex
CREATE INDEX "ecommerce_wishlist_items_wishlistId_idx" ON "ecommerce_wishlist_items"("wishlistId");

-- CreateIndex
CREATE INDEX "ecommerce_wishlist_items_productId_idx" ON "ecommerce_wishlist_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ecommerce_wishlist_items_wishlistId_itemKey_key" ON "ecommerce_wishlist_items"("wishlistId", "itemKey");

-- AddForeignKey
ALTER TABLE "ecommerce_wishlist_items" ADD CONSTRAINT "ecommerce_wishlist_items_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "ecommerce_wishlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

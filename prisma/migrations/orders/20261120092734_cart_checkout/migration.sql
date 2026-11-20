-- CreateTable
CREATE TABLE "ecommerce_carts" (
    "id" SERIAL NOT NULL,
    "cartToken" TEXT NOT NULL,
    "customerId" TEXT,
    "customerEmail" TEXT,
    "promoCode" TEXT,
    "promoPercent" DOUBLE PRECISION,
    "promoValidUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_cart_items" (
    "id" SERIAL NOT NULL,
    "cartId" INTEGER NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "size" TEXT,
    "color" TEXT,
    "image" TEXT,
    "lineTotal" DOUBLE PRECISION NOT NULL,
    "variantKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ecommerce_carts_cartToken_key" ON "ecommerce_carts"("cartToken");

-- CreateIndex
CREATE INDEX "ecommerce_carts_customerId_idx" ON "ecommerce_carts"("customerId");

-- CreateIndex
CREATE INDEX "ecommerce_carts_updatedAt_idx" ON "ecommerce_carts"("updatedAt");

-- CreateIndex
CREATE INDEX "ecommerce_cart_items_cartId_idx" ON "ecommerce_cart_items"("cartId");

-- CreateIndex
CREATE INDEX "ecommerce_cart_items_productId_idx" ON "ecommerce_cart_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ecommerce_cart_items_cartId_variantKey_key" ON "ecommerce_cart_items"("cartId", "variantKey");

-- AddForeignKey
ALTER TABLE "ecommerce_cart_items" ADD CONSTRAINT "ecommerce_cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "ecommerce_carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

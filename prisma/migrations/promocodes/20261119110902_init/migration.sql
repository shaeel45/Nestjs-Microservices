-- CreateTable
CREATE TABLE "ecommerce_promo_codes" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "maxUses" INTEGER,
    "minOrderAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_promo_code_redemptions" (
    "id" SERIAL NOT NULL,
    "promoCodeId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "orderReference" TEXT,
    "orderAmount" DOUBLE PRECISION NOT NULL,
    "discountAmount" DOUBLE PRECISION NOT NULL,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ecommerce_promo_code_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ecommerce_promo_codes_code_key" ON "ecommerce_promo_codes"("code");

-- CreateIndex
CREATE INDEX "ecommerce_promo_codes_active_idx" ON "ecommerce_promo_codes"("active");

-- CreateIndex
CREATE INDEX "ecommerce_promo_codes_expiresAt_idx" ON "ecommerce_promo_codes"("expiresAt");

-- CreateIndex
CREATE INDEX "ecommerce_promo_code_redemptions_promoCodeId_createdAt_idx" ON "ecommerce_promo_code_redemptions"("promoCodeId", "createdAt");

-- CreateIndex
CREATE INDEX "ecommerce_promo_code_redemptions_orderReference_idx" ON "ecommerce_promo_code_redemptions"("orderReference");

-- AddForeignKey
ALTER TABLE "ecommerce_promo_code_redemptions" ADD CONSTRAINT "ecommerce_promo_code_redemptions_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "ecommerce_promo_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

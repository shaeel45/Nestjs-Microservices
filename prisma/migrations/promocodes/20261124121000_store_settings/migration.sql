-- CreateTable
CREATE TABLE "ecommerce_store_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "storeName" TEXT NOT NULL DEFAULT 'ShopForge',
    "tagline" TEXT NOT NULL DEFAULT 'Modern Wardrobe Essentials',
    "supportEmail" TEXT NOT NULL DEFAULT 'support@shopforge.com',
    "bannerText" TEXT NOT NULL DEFAULT '',
    "bannerActive" BOOLEAN NOT NULL DEFAULT true,
    "freeShippingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "freeShippingThreshold" DOUBLE PRECISION NOT NULL DEFAULT 75,
    "standardShippingRate" DOUBLE PRECISION NOT NULL DEFAULT 9.99,
    "expressShippingRate" DOUBLE PRECISION NOT NULL DEFAULT 14.99,
    "handlingDays" INTEGER NOT NULL DEFAULT 1,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_store_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ecommerce_auth" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ecommerce_auth_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ecommerce_auth_email_key" ON "ecommerce_auth"("email");

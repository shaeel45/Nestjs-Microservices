CREATE TABLE "ecommerce_users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ecommerce_users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ecommerce_users_email_key" ON "ecommerce_users"("email");

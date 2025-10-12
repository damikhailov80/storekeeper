/*
  Warnings:

  - You are about to drop the `products` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."products";

-- CreateTable
CREATE TABLE "ean_data" (
    "ean" VARCHAR(20) NOT NULL,
    "name" TEXT,
    "quantity" INTEGER DEFAULT 0,
    "min_quantity" INTEGER DEFAULT 5,
    "location" VARCHAR(100),
    "category" VARCHAR(100) DEFAULT 'Cosmetics',
    "unit" VARCHAR(20) DEFAULT 'pieces',
    "price" DECIMAL(10,2),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ean_data_pkey" PRIMARY KEY ("ean")
);

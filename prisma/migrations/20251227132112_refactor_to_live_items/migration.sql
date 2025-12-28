/*
  Warnings:

  - You are about to drop the column `productId` on the `saleitem` table. All the data in the column will be lost.
  - You are about to drop the column `productVariantId` on the `saleitem` table. All the data in the column will be lost.
  - You are about to drop the `product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `productvariant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `stockmovement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `variantattributevalue` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `liveItemId` to the `SaleItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `product` DROP FOREIGN KEY `Product_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `productvariant` DROP FOREIGN KEY `ProductVariant_productId_fkey`;

-- DropForeignKey
ALTER TABLE `saleitem` DROP FOREIGN KEY `SaleItem_productId_fkey`;

-- DropForeignKey
ALTER TABLE `saleitem` DROP FOREIGN KEY `SaleItem_productVariantId_fkey`;

-- DropForeignKey
ALTER TABLE `stockmovement` DROP FOREIGN KEY `StockMovement_productVariantId_fkey`;

-- DropForeignKey
ALTER TABLE `variantattributevalue` DROP FOREIGN KEY `VariantAttributeValue_attributeValueId_fkey`;

-- DropForeignKey
ALTER TABLE `variantattributevalue` DROP FOREIGN KEY `VariantAttributeValue_variantId_fkey`;

-- AlterTable
ALTER TABLE `saleitem` DROP COLUMN `productId`,
    DROP COLUMN `productVariantId`,
    ADD COLUMN `liveItemId` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `product`;

-- DropTable
DROP TABLE `productvariant`;

-- DropTable
DROP TABLE `stockmovement`;

-- DropTable
DROP TABLE `variantattributevalue`;

-- CreateTable
CREATE TABLE `LiveItemAttributeValue` (
    `id` VARCHAR(191) NOT NULL,
    `liveItemId` VARCHAR(191) NOT NULL,
    `attributeValueId` VARCHAR(191) NULL,
    `textValue` VARCHAR(191) NULL,
    `numberValue` DECIMAL(10, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LiveItemAttributeValue_liveItemId_idx`(`liveItemId`),
    INDEX `LiveItemAttributeValue_attributeValueId_idx`(`attributeValueId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LiveItem` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `livestreamId` VARCHAR(191) NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `status` ENUM('available', 'reserved', 'sold') NOT NULL DEFAULT 'available',
    `imageUrl` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LiveItem_organizationId_idx`(`organizationId`),
    INDEX `LiveItem_categoryId_idx`(`categoryId`),
    INDEX `LiveItem_livestreamId_idx`(`livestreamId`),
    INDEX `LiveItem_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `SaleItem_liveItemId_idx` ON `SaleItem`(`liveItemId`);

-- AddForeignKey
ALTER TABLE `LiveItemAttributeValue` ADD CONSTRAINT `LiveItemAttributeValue_liveItemId_fkey` FOREIGN KEY (`liveItemId`) REFERENCES `LiveItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LiveItemAttributeValue` ADD CONSTRAINT `LiveItemAttributeValue_attributeValueId_fkey` FOREIGN KEY (`attributeValueId`) REFERENCES `AttributeValue`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LiveItem` ADD CONSTRAINT `LiveItem_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `ProductCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LiveItem` ADD CONSTRAINT `LiveItem_livestreamId_fkey` FOREIGN KEY (`livestreamId`) REFERENCES `Livestream`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SaleItem` ADD CONSTRAINT `SaleItem_liveItemId_fkey` FOREIGN KEY (`liveItemId`) REFERENCES `LiveItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

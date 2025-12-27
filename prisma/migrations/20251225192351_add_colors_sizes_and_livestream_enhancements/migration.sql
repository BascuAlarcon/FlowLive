/*
  Warnings:

  - A unique constraint covering the columns `[productId,colorId,sizeId]` on the table `ProductVariant` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `livestream` ADD COLUMN `moderatorId` VARCHAR(191) NULL,
    ADD COLUMN `status` ENUM('active', 'closed') NOT NULL DEFAULT 'active',
    ADD COLUMN `totalUnitsSold` INTEGER NULL;

-- AlterTable
ALTER TABLE `productvariant` ADD COLUMN `colorId` VARCHAR(191) NULL,
    ADD COLUMN `sizeId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Color` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `hexCode` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Color_organizationId_isActive_idx`(`organizationId`, `isActive`),
    UNIQUE INDEX `Color_organizationId_name_key`(`organizationId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Size` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Size_organizationId_isActive_idx`(`organizationId`, `isActive`),
    UNIQUE INDEX `Size_organizationId_name_key`(`organizationId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Livestream_moderatorId_idx` ON `Livestream`(`moderatorId`);

-- CreateIndex
CREATE INDEX `Livestream_status_idx` ON `Livestream`(`status`);

-- CreateIndex
CREATE INDEX `ProductVariant_colorId_idx` ON `ProductVariant`(`colorId`);

-- CreateIndex
CREATE INDEX `ProductVariant_sizeId_idx` ON `ProductVariant`(`sizeId`);

-- CreateIndex
CREATE UNIQUE INDEX `ProductVariant_productId_colorId_sizeId_key` ON `ProductVariant`(`productId`, `colorId`, `sizeId`);

-- AddForeignKey
ALTER TABLE `ProductVariant` ADD CONSTRAINT `ProductVariant_colorId_fkey` FOREIGN KEY (`colorId`) REFERENCES `Color`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductVariant` ADD CONSTRAINT `ProductVariant_sizeId_fkey` FOREIGN KEY (`sizeId`) REFERENCES `Size`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

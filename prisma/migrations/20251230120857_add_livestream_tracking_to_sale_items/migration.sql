-- AlterTable
ALTER TABLE `saleitem` ADD COLUMN `attributesSnapshot` JSON NULL,
    ADD COLUMN `livestreamId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `SaleItem_livestreamId_idx` ON `SaleItem`(`livestreamId`);

-- AddForeignKey
ALTER TABLE `SaleItem` ADD CONSTRAINT `SaleItem_livestreamId_fkey` FOREIGN KEY (`livestreamId`) REFERENCES `Livestream`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

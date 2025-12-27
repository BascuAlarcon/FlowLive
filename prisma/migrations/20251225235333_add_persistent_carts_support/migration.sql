-- AlterTable
ALTER TABLE `sale` ADD COLUMN `lastLivestreamId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Sale_customerId_status_idx` ON `Sale`(`customerId`, `status`);

-- CreateIndex
CREATE INDEX `Sale_status_updatedAt_idx` ON `Sale`(`status`, `updatedAt`);

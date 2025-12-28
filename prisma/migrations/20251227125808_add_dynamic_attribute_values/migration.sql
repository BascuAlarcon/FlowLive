/*
  Warnings:

  - You are about to drop the column `moderatorId` on the `livestream` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `livestream` table. All the data in the column will be lost.
  - You are about to drop the column `totalUnitsSold` on the `livestream` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `variantattributevalue` DROP FOREIGN KEY `VariantAttributeValue_attributeValueId_fkey`;

-- DropIndex
DROP INDEX `Livestream_moderatorId_idx` ON `livestream`;

-- DropIndex
DROP INDEX `Livestream_status_idx` ON `livestream`;

-- DropIndex
DROP INDEX `VariantAttributeValue_variantId_attributeValueId_key` ON `variantattributevalue`;

-- AlterTable
ALTER TABLE `livestream` DROP COLUMN `moderatorId`,
    DROP COLUMN `status`,
    DROP COLUMN `totalUnitsSold`;

-- AlterTable
ALTER TABLE `variantattributevalue` ADD COLUMN `numberValue` DECIMAL(10, 2) NULL,
    ADD COLUMN `textValue` VARCHAR(191) NULL,
    MODIFY `attributeValueId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `VariantAttributeValue` ADD CONSTRAINT `VariantAttributeValue_attributeValueId_fkey` FOREIGN KEY (`attributeValueId`) REFERENCES `AttributeValue`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

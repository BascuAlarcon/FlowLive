/*
  Warnings:

  - You are about to drop the column `colorId` on the `productvariant` table. All the data in the column will be lost.
  - You are about to drop the column `sizeId` on the `productvariant` table. All the data in the column will be lost.
  - You are about to drop the `color` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `size` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `categoryId` to the `Product` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Crear las nuevas tablas
-- CreateTable
CREATE TABLE `ProductCategory` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProductCategory_organizationId_isActive_idx`(`organizationId`, `isActive`),
    UNIQUE INDEX `ProductCategory_organizationId_name_key`(`organizationId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CategoryAttribute` (
    `id` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('select', 'text', 'number') NOT NULL,
    `isRequired` BOOLEAN NOT NULL DEFAULT false,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CategoryAttribute_categoryId_idx`(`categoryId`),
    INDEX `CategoryAttribute_categoryId_order_idx`(`categoryId`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AttributeValue` (
    `id` VARCHAR(191) NOT NULL,
    `attributeId` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `hexCode` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AttributeValue_attributeId_isActive_idx`(`attributeId`, `isActive`),
    UNIQUE INDEX `AttributeValue_attributeId_value_key`(`attributeId`, `value`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VariantAttributeValue` (
    `id` VARCHAR(191) NOT NULL,
    `variantId` VARCHAR(191) NOT NULL,
    `attributeValueId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `VariantAttributeValue_variantId_idx`(`variantId`),
    INDEX `VariantAttributeValue_attributeValueId_idx`(`attributeValueId`),
    UNIQUE INDEX `VariantAttributeValue_variantId_attributeValueId_key`(`variantId`, `attributeValueId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Step 2: Migrar datos existentes de Color y Size a las nuevas tablas
-- Crear categoría "Ropa" por defecto para cada organización que tenga productos
INSERT INTO `ProductCategory` (`id`, `organizationId`, `name`, `description`, `isActive`, `createdAt`, `updatedAt`)
SELECT 
    CONCAT('cat_', UUID()) as id,
    p.organizationId,
    'Ropa' as name,
    'Categoría por defecto (migración)' as description,
    true as isActive,
    NOW() as createdAt,
    NOW() as updatedAt
FROM (SELECT DISTINCT organizationId FROM `Product`) p;

-- Crear atributos "Color" y "Talla" para cada categoría "Ropa"
INSERT INTO `CategoryAttribute` (`id`, `categoryId`, `name`, `type`, `isRequired`, `order`, `createdAt`)
SELECT 
    CONCAT('attr_color_', pc.id) as id,
    pc.id as categoryId,
    'Color' as name,
    'select' as type,
    false as isRequired,
    0 as `order`,
    NOW() as createdAt
FROM `ProductCategory` pc WHERE pc.name = 'Ropa';

INSERT INTO `CategoryAttribute` (`id`, `categoryId`, `name`, `type`, `isRequired`, `order`, `createdAt`)
SELECT 
    CONCAT('attr_talla_', pc.id) as id,
    pc.id as categoryId,
    'Talla' as name,
    'select' as type,
    false as isRequired,
    1 as `order`,
    NOW() as createdAt
FROM `ProductCategory` pc WHERE pc.name = 'Ropa';

-- Migrar valores de Color existentes a AttributeValue
INSERT INTO `AttributeValue` (`id`, `attributeId`, `value`, `hexCode`, `order`, `isActive`, `createdAt`)
SELECT 
    CONCAT('val_', c.id) as id,
    ca.id as attributeId,
    c.name as value,
    c.hexCode,
    0 as `order`,
    c.isActive,
    NOW() as createdAt
FROM `color` c
JOIN `ProductCategory` pc ON pc.organizationId = c.organizationId AND pc.name = 'Ropa'
JOIN `CategoryAttribute` ca ON ca.categoryId = pc.id AND ca.name = 'Color';

-- Migrar valores de Size existentes a AttributeValue
INSERT INTO `AttributeValue` (`id`, `attributeId`, `value`, `hexCode`, `order`, `isActive`, `createdAt`)
SELECT 
    CONCAT('val_', s.id) as id,
    ca.id as attributeId,
    s.name as value,
    NULL as hexCode,
    s.`order`,
    s.isActive,
    NOW() as createdAt
FROM `size` s
JOIN `ProductCategory` pc ON pc.organizationId = s.organizationId AND pc.name = 'Ropa'
JOIN `CategoryAttribute` ca ON ca.categoryId = pc.id AND ca.name = 'Talla';

-- Step 3: Agregar categoryId a Product (temporal como nullable)
ALTER TABLE `Product` ADD COLUMN `categoryId` VARCHAR(191) NULL;

-- Asignar la categoría "Ropa" a todos los productos existentes
UPDATE `Product` p
JOIN `ProductCategory` pc ON pc.organizationId = p.organizationId AND pc.name = 'Ropa'
SET p.categoryId = pc.id;

-- Ahora hacer categoryId NOT NULL
ALTER TABLE `Product` MODIFY `categoryId` VARCHAR(191) NOT NULL;

-- Step 4: Eliminar relaciones de ProductVariant con Color y Size
-- DropForeignKey
ALTER TABLE `productvariant` DROP FOREIGN KEY `ProductVariant_colorId_fkey`;

-- DropForeignKey
ALTER TABLE `productvariant` DROP FOREIGN KEY `ProductVariant_sizeId_fkey`;

-- Crear relaciones en VariantAttributeValue antes de eliminar colorId y sizeId
-- Migrar colorId de ProductVariant a VariantAttributeValue
INSERT INTO `VariantAttributeValue` (`id`, `variantId`, `attributeValueId`, `createdAt`)
SELECT 
    CONCAT('vav_color_', pv.id) as id,
    pv.id as variantId,
    av.id as attributeValueId,
    NOW() as createdAt
FROM `productvariant` pv
JOIN `color` c ON c.id = pv.colorId
JOIN `Product` p ON p.id = pv.productId
JOIN `ProductCategory` pc ON pc.id = p.categoryId AND pc.organizationId = c.organizationId
JOIN `CategoryAttribute` ca ON ca.categoryId = pc.id AND ca.name = 'Color'
JOIN `AttributeValue` av ON av.attributeId = ca.id AND av.value = c.name
WHERE pv.colorId IS NOT NULL;

-- Migrar sizeId de ProductVariant a VariantAttributeValue
INSERT INTO `VariantAttributeValue` (`id`, `variantId`, `attributeValueId`, `createdAt`)
SELECT 
    CONCAT('vav_size_', pv.id) as id,
    pv.id as variantId,
    av.id as attributeValueId,
    NOW() as createdAt
FROM `productvariant` pv
JOIN `size` s ON s.id = pv.sizeId
JOIN `Product` p ON p.id = pv.productId
JOIN `ProductCategory` pc ON pc.id = p.categoryId AND pc.organizationId = s.organizationId
JOIN `CategoryAttribute` ca ON ca.categoryId = pc.id AND ca.name = 'Talla'
JOIN `AttributeValue` av ON av.attributeId = ca.id AND av.value = s.name
WHERE pv.sizeId IS NOT NULL;

-- Step 5: Eliminar columnas y tablas antiguas
-- DropIndex
DROP INDEX `Product_organizationId_isActive_idx` ON `product`;

-- DropIndex
DROP INDEX `ProductVariant_productId_colorId_sizeId_key` ON `productvariant`;

-- AlterTable
ALTER TABLE `productvariant` DROP COLUMN `colorId`,
    DROP COLUMN `sizeId`;

-- DropTable
DROP TABLE `color`;

-- DropTable
DROP TABLE `size`;

-- Step 6: Crear índices nuevos
-- CreateIndex
CREATE INDEX `Product_organizationId_categoryId_isActive_idx` ON `Product`(`organizationId`, `categoryId`, `isActive`);

-- CreateIndex
CREATE INDEX `Product_categoryId_idx` ON `Product`(`categoryId`);

-- Step 7: Agregar Foreign Keys
-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `ProductCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CategoryAttribute` ADD CONSTRAINT `CategoryAttribute_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `ProductCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttributeValue` ADD CONSTRAINT `AttributeValue_attributeId_fkey` FOREIGN KEY (`attributeId`) REFERENCES `CategoryAttribute`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VariantAttributeValue` ADD CONSTRAINT `VariantAttributeValue_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VariantAttributeValue` ADD CONSTRAINT `VariantAttributeValue_attributeValueId_fkey` FOREIGN KEY (`attributeValueId`) REFERENCES `AttributeValue`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

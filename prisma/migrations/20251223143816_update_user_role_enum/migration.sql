-- AlterTable
ALTER TABLE `organizationuser` MODIFY `role` ENUM('owner', 'seller', 'moderator', 'logistics', 'admin', 'superadmin') NOT NULL;

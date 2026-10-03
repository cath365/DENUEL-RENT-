-- AlterTable
ALTER TABLE `serviceprovider` ADD COLUMN `bio` TEXT NULL,
    ADD COLUMN `completedJobs` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `hourlyRate` DOUBLE NULL,
    ADD COLUMN `isAvailable` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `languages` JSON NULL,
    ADD COLUMN `minimumCharge` DOUBLE NULL,
    ADD COLUMN `nrcNumber` VARCHAR(191) NULL,
    ADD COLUMN `profilePhotoUrl` VARCHAR(191) NULL,
    ADD COLUMN `serviceAreas` JSON NULL,
    ADD COLUMN `tpinNumber` VARCHAR(191) NULL,
    ADD COLUMN `workingHours` JSON NULL,
    MODIFY `category` ENUM('HOME_INSPECTOR', 'MOVER', 'CLEANER', 'PHOTOGRAPHER', 'CONTRACTOR', 'ELECTRICIAN', 'PLUMBER', 'PAINTER', 'LANDSCAPER', 'PEST_CONTROL', 'HOME_INSURANCE', 'HOME_WARRANTY', 'LEGAL', 'MORTGAGE_BROKER', 'INTERIOR_DESIGNER', 'SECURITY', 'HVAC', 'ROOFING', 'FLOORING', 'GARDENER', 'MAID', 'OTHER') NOT NULL;

-- CreateTable
CREATE TABLE `ServiceDocument` (
    `id` VARCHAR(191) NOT NULL,
    `providerId` VARCHAR(191) NOT NULL,
    `type` ENUM('NRC', 'CERTIFICATE', 'LICENSE', 'INSURANCE', 'QUALIFICATION', 'REFERENCE', 'PORTFOLIO', 'ID_PHOTO', 'BACKGROUND_CHECK', 'OTHER') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NULL,
    `mimeType` VARCHAR(191) NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `verifiedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServicePortfolio` (
    `id` VARCHAR(191) NOT NULL,
    `providerId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,
    `projectDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ServiceDocument` ADD CONSTRAINT `ServiceDocument_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `ServiceProvider`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServicePortfolio` ADD CONSTRAINT `ServicePortfolio_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `ServiceProvider`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

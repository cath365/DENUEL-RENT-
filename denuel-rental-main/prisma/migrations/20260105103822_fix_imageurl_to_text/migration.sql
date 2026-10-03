/*
  Warnings:

  - You are about to drop the column `featuresJson` on the `subscriptionplan` table. All the data in the column will be lost.
  - You are about to drop the column `priceZmw` on the `subscriptionplan` table. All the data in the column will be lost.
  - You are about to drop the column `amountZmw` on the `transaction` table. All the data in the column will be lost.
  - You are about to drop the column `feeZmw` on the `transaction` table. All the data in the column will be lost.
  - You are about to drop the column `netZmw` on the `transaction` table. All the data in the column will be lost.
  - You are about to drop the column `referenceId` on the `transaction` table. All the data in the column will be lost.
  - You are about to alter the column `type` on the `transaction` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(16))`.
  - You are about to drop the `subscription` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `price` to the `SubscriptionPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `SubscriptionPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amount` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `transaction` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `subscription` DROP FOREIGN KEY `Subscription_planId_fkey`;

-- DropForeignKey
ALTER TABLE `subscription` DROP FOREIGN KEY `Subscription_userId_fkey`;

-- AlterTable
ALTER TABLE `propertyimage` ADD COLUMN `is360` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `roomName` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `servicedocument` MODIFY `type` ENUM('NATIONAL_ID', 'PASSPORT', 'BUSINESS_LICENSE', 'PROOF_OF_ADDRESS', 'PROPERTY_TITLE', 'TAX_CLEARANCE', 'NRC', 'CERTIFICATE', 'LICENSE', 'INSURANCE', 'QUALIFICATION', 'REFERENCE', 'PORTFOLIO', 'ID_PHOTO', 'BACKGROUND_CHECK', 'OTHER') NOT NULL;

-- AlterTable
ALTER TABLE `subscriptionplan` DROP COLUMN `featuresJson`,
    DROP COLUMN `priceZmw`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `currency` VARCHAR(191) NOT NULL DEFAULT 'ZMW',
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `freeInquiries` INTEGER NOT NULL DEFAULT 5,
    ADD COLUMN `hasAnalytics` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `hasAutoBoost` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `hasFeaturedBadge` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `hasPrioritySupport` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `maxBoosts` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `maxListings` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `maxPhotos` INTEGER NOT NULL DEFAULT 5,
    ADD COLUMN `price` DOUBLE NOT NULL,
    ADD COLUMN `sortOrder` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `transaction` DROP COLUMN `amountZmw`,
    DROP COLUMN `feeZmw`,
    DROP COLUMN `netZmw`,
    DROP COLUMN `referenceId`,
    ADD COLUMN `amount` DOUBLE NOT NULL,
    ADD COLUMN `commission` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `paymentId` VARCHAR(191) NULL,
    ADD COLUMN `propertyId` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `userId` VARCHAR(191) NOT NULL,
    MODIFY `type` ENUM('SUBSCRIPTION', 'LISTING_FEE', 'FEATURED_LISTING', 'BOOST_LISTING', 'INQUIRY_UNLOCK', 'COMMISSION', 'SERVICE_BOOKING', 'ADVERTISEMENT') NOT NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `businessLicense` VARCHAR(191) NULL,
    ADD COLUMN `companyName` VARCHAR(191) NULL,
    ADD COLUMN `isBusinessVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isEmailVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isIdVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isPhoneVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `nrcNumber` VARCHAR(191) NULL,
    ADD COLUMN `trustScore` DOUBLE NOT NULL DEFAULT 0.0,
    ADD COLUMN `verificationNotes` TEXT NULL,
    ADD COLUMN `verifiedAt` DATETIME(3) NULL;

-- DropTable
DROP TABLE `subscription`;

-- CreateTable
CREATE TABLE `SystemSettings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'main',
    `siteName` VARCHAR(191) NOT NULL DEFAULT 'DENUEL',
    `siteDescription` TEXT NULL,
    `contactEmail` VARCHAR(191) NULL,
    `contactPhone` VARCHAR(191) NULL,
    `supportEmail` VARCHAR(191) NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'ZMW',
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'Africa/Lusaka',
    `maintenanceMode` BOOLEAN NOT NULL DEFAULT false,
    `allowRegistration` BOOLEAN NOT NULL DEFAULT true,
    `requireEmailVerification` BOOLEAN NOT NULL DEFAULT false,
    `maxPropertyImages` INTEGER NOT NULL DEFAULT 10,
    `maxFileSize` INTEGER NOT NULL DEFAULT 5,
    `commissionRate` DOUBLE NOT NULL DEFAULT 5.0,
    `minRentPrice` DOUBLE NOT NULL DEFAULT 100,
    `maxRentPrice` DOUBLE NOT NULL DEFAULT 100000,
    `featuredListingPrice` DOUBLE NOT NULL DEFAULT 50,
    `enableDriverFeature` BOOLEAN NOT NULL DEFAULT true,
    `enableServicesFeature` BOOLEAN NOT NULL DEFAULT true,
    `enableTransportFeature` BOOLEAN NOT NULL DEFAULT true,
    `logoUrl` TEXT NULL,
    `faviconUrl` TEXT NULL,
    `primaryColor` VARCHAR(191) NOT NULL DEFAULT '#2563eb',
    `secondaryColor` VARCHAR(191) NOT NULL DEFAULT '#1e40af',
    `accentColor` VARCHAR(191) NOT NULL DEFAULT '#3b82f6',
    `headerBgColor` VARCHAR(191) NOT NULL DEFAULT '#ffffff',
    `footerBgColor` VARCHAR(191) NOT NULL DEFAULT '#1f2937',
    `facebookUrl` VARCHAR(191) NULL,
    `twitterUrl` VARCHAR(191) NULL,
    `instagramUrl` VARCHAR(191) NULL,
    `linkedinUrl` VARCHAR(191) NULL,
    `youtubeUrl` VARCHAR(191) NULL,
    `whatsappNumber` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Advertisement` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `imageUrl` TEXT NULL,
    `linkUrl` VARCHAR(191) NOT NULL,
    `placement` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `impressions` INTEGER NOT NULL DEFAULT 0,
    `clicks` INTEGER NOT NULL DEFAULT 0,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserSubscription` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    `currentPeriodStart` DATETIME(3) NOT NULL,
    `currentPeriodEnd` DATETIME(3) NOT NULL,
    `cancelAtPeriodEnd` BOOLEAN NOT NULL DEFAULT false,
    `trialEndsAt` DATETIME(3) NULL,
    `listingsUsed` INTEGER NOT NULL DEFAULT 0,
    `boostsUsed` INTEGER NOT NULL DEFAULT 0,
    `inquiriesUsed` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserSubscription_userId_key`(`userId`),
    INDEX `UserSubscription_userId_idx`(`userId`),
    INDEX `UserSubscription_planId_idx`(`planId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'ZMW',
    `status` ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `paymentMethod` ENUM('AIRTEL_MONEY', 'MTN_MOMO', 'VISA', 'MASTERCARD', 'BANK_TRANSFER') NOT NULL,
    `transactionRef` VARCHAR(191) NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `metadata` JSON NULL,
    `failureReason` TEXT NULL,
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Payment_transactionRef_key`(`transactionRef`),
    INDEX `Payment_userId_idx`(`userId`),
    INDEX `Payment_transactionRef_idx`(`transactionRef`),
    INDEX `Payment_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PropertyBoost` (
    `id` VARCHAR(191) NOT NULL,
    `propertyId` VARCHAR(191) NOT NULL,
    `type` ENUM('FEATURED', 'URGENT', 'HOMEPAGE', 'TOP_DAILY') NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `price` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'ZMW',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PropertyBoost_propertyId_idx`(`propertyId`),
    INDEX `PropertyBoost_isActive_idx`(`isActive`),
    INDEX `PropertyBoost_endDate_idx`(`endDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PropertyInquiry` (
    `id` VARCHAR(191) NOT NULL,
    `propertyId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `message` TEXT NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `isUnlocked` BOOLEAN NOT NULL DEFAULT false,
    `unlockedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PropertyInquiry_propertyId_idx`(`propertyId`),
    INDEX `PropertyInquiry_userId_idx`(`userId`),
    INDEX `PropertyInquiry_isUnlocked_idx`(`isUnlocked`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PropertyTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `propertyId` VARCHAR(191) NOT NULL,
    `landlordId` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NULL,
    `transactionType` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `commission` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'ZMW',
    `completedAt` DATETIME(3) NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PropertyTransaction_propertyId_idx`(`propertyId`),
    INDEX `PropertyTransaction_landlordId_idx`(`landlordId`),
    INDEX `PropertyTransaction_completedAt_idx`(`completedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SupportMessage` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `category` ENUM('ADS_INQUIRY', 'FEATURE_REQUEST', 'TECHNICAL_SUPPORT', 'BILLING', 'GENERAL', 'COMPLAINT') NOT NULL DEFAULT 'GENERAL',
    `subject` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `contactInfo` VARCHAR(191) NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `isResolved` BOOLEAN NOT NULL DEFAULT false,
    `adminNotes` TEXT NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SupportMessage_userId_idx`(`userId`),
    INDEX `SupportMessage_isRead_idx`(`isRead`),
    INDEX `SupportMessage_isResolved_idx`(`isResolved`),
    INDEX `SupportMessage_category_idx`(`category`),
    INDEX `SupportMessage_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VerificationDocument` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `documentType` ENUM('NATIONAL_ID', 'PASSPORT', 'BUSINESS_LICENSE', 'PROOF_OF_ADDRESS', 'PROPERTY_TITLE', 'TAX_CLEARANCE', 'NRC', 'CERTIFICATE', 'LICENSE', 'INSURANCE', 'QUALIFICATION', 'REFERENCE', 'PORTFOLIO', 'ID_PHOTO', 'BACKGROUND_CHECK', 'OTHER') NOT NULL,
    `documentUrl` TEXT NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `reviewedBy` VARCHAR(191) NULL,
    `reviewNotes` TEXT NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `metadata` TEXT NULL,

    INDEX `VerificationDocument_userId_idx`(`userId`),
    INDEX `VerificationDocument_status_idx`(`status`),
    INDEX `VerificationDocument_documentType_idx`(`documentType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserReview` (
    `id` VARCHAR(191) NOT NULL,
    `reviewerId` VARCHAR(191) NOT NULL,
    `reviewedId` VARCHAR(191) NOT NULL,
    `propertyId` VARCHAR(191) NULL,
    `rating` INTEGER NOT NULL,
    `comment` TEXT NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UserReview_reviewerId_idx`(`reviewerId`),
    INDEX `UserReview_reviewedId_idx`(`reviewedId`),
    INDEX `UserReview_propertyId_idx`(`propertyId`),
    INDEX `UserReview_rating_idx`(`rating`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Testimonial` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `avatar` VARCHAR(191) NULL,
    `rating` INTEGER NOT NULL,
    `title` VARCHAR(191) NULL,
    `content` TEXT NOT NULL,
    `propertyTitle` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `order` INTEGER NOT NULL DEFAULT 0,
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Testimonial_status_idx`(`status`),
    INDEX `Testimonial_featured_idx`(`featured`),
    INDEX `Testimonial_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Transaction_userId_idx` ON `Transaction`(`userId`);

-- CreateIndex
CREATE INDEX `Transaction_propertyId_idx` ON `Transaction`(`propertyId`);

-- CreateIndex
CREATE INDEX `Transaction_type_idx` ON `Transaction`(`type`);

-- CreateIndex
CREATE INDEX `Transaction_createdAt_idx` ON `Transaction`(`createdAt`);

-- AddForeignKey
ALTER TABLE `UserSubscription` ADD CONSTRAINT `UserSubscription_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserSubscription` ADD CONSTRAINT `UserSubscription_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `SubscriptionPlan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `Payment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PropertyBoost` ADD CONSTRAINT `PropertyBoost_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PropertyInquiry` ADD CONSTRAINT `PropertyInquiry_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PropertyInquiry` ADD CONSTRAINT `PropertyInquiry_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PropertyTransaction` ADD CONSTRAINT `PropertyTransaction_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportMessage` ADD CONSTRAINT `SupportMessage_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VerificationDocument` ADD CONSTRAINT `VerificationDocument_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserReview` ADD CONSTRAINT `UserReview_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserReview` ADD CONSTRAINT `UserReview_reviewedId_fkey` FOREIGN KEY (`reviewedId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Testimonial` ADD CONSTRAINT `Testimonial_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Service provider professional profile and trust fields
ALTER TABLE `ServiceProvider`
  ADD COLUMN `providerType` VARCHAR(191) NOT NULL DEFAULT 'INDIVIDUAL',
  ADD COLUMN `contactPersonName` VARCHAR(191) NULL,
  ADD COLUMN `contactPersonPosition` VARCHAR(191) NULL,
  ADD COLUMN `companyRegistrationNumber` VARCHAR(191) NULL,
  ADD COLUMN `teamSize` INTEGER NULL,
  ADD COLUMN `whatsappNumber` VARCHAR(191) NULL,
  ADD COLUMN `emergencyService` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `backgroundCheckedStaff` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `insured` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `insuranceProvider` VARCHAR(191) NULL,
  ADD COLUMN `responseTimeText` VARCHAR(191) NULL,
  ADD COLUMN `categoryDetails` JSON NULL;

-- Additional professional trust fields for service providers.
-- providerType, contactPersonName, contactPersonRole, profileCompletion and
-- verificationStatus already exist in the ServiceProvider model.
ALTER TABLE `ServiceProvider`
  ADD COLUMN `companyRegistrationNumber` VARCHAR(191) NULL,
  ADD COLUMN `teamSize` INTEGER NULL,
  ADD COLUMN `whatsappNumber` VARCHAR(191) NULL,
  ADD COLUMN `emergencyService` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `backgroundCheckedStaff` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `insured` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `insuranceProvider` VARCHAR(191) NULL,
  ADD COLUMN `responseTimeText` VARCHAR(191) NULL,
  ADD COLUMN `categoryDetails` JSON NULL;

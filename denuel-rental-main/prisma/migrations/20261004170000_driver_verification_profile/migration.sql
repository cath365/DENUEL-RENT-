-- Expand driver profiles so the application, admin review and dashboard
-- persist the same real information collected from drivers.
ALTER TABLE `DriverProfile`
  MODIFY COLUMN `vehicleType` ENUM('MOTORBIKE', 'CAR', 'SUV', 'VAN', 'TRUCK_SMALL', 'TRUCK_MEDIUM', 'TRUCK_LARGE') NOT NULL,
  ADD COLUMN `nrcNumber` VARCHAR(191) NULL,
  ADD COLUMN `vehicleMake` VARCHAR(191) NULL,
  ADD COLUMN `vehicleModel` VARCHAR(191) NULL,
  ADD COLUMN `vehicleYear` INTEGER NULL,
  ADD COLUMN `vehicleColor` VARCHAR(191) NULL,
  ADD COLUMN `experience` VARCHAR(191) NULL,
  ADD COLUMN `bio` TEXT NULL,
  ADD COLUMN `serviceAreas` JSON NULL,
  ADD COLUMN `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  ADD COLUMN `rejectionReason` TEXT NULL;

-- VehicleType is shared by driver profiles, transport requests and pricing rules.
ALTER TABLE `TransportRequest`
  MODIFY COLUMN `vehicleType` ENUM('MOTORBIKE', 'CAR', 'SUV', 'VAN', 'TRUCK_SMALL', 'TRUCK_MEDIUM', 'TRUCK_LARGE') NOT NULL;

ALTER TABLE `PricingRule`
  MODIFY COLUMN `vehicleType` ENUM('MOTORBIKE', 'CAR', 'SUV', 'VAN', 'TRUCK_SMALL', 'TRUCK_MEDIUM', 'TRUCK_LARGE') NOT NULL;

CREATE TABLE `DriverDocument` (
  `id` VARCHAR(191) NOT NULL,
  `driverId` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `fileUrl` TEXT NOT NULL,
  `fileSize` INTEGER NULL,
  `mimeType` VARCHAR(191) NULL,
  `isVerified` BOOLEAN NOT NULL DEFAULT false,
  `verifiedAt` DATETIME(3) NULL,
  `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `DriverDocument_driverId_type_key`(`driverId`, `type`),
  INDEX `DriverDocument_driverId_idx`(`driverId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `DriverDocument`
  ADD CONSTRAINT `DriverDocument_driverId_fkey`
  FOREIGN KEY (`driverId`) REFERENCES `DriverProfile`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

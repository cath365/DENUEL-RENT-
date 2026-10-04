-- Expand transport registration data and allow general transport requests.

ALTER TABLE `DriverProfile`
  MODIFY `vehicleType` ENUM('MOTORBIKE','CAR','SUV','VAN','TRUCK_SMALL','TRUCK_MEDIUM','TRUCK_LARGE') NOT NULL,
  ADD COLUMN `vehicleMake` VARCHAR(191) NULL,
  ADD COLUMN `vehicleModel` VARCHAR(191) NULL,
  ADD COLUMN `vehicleYear` INTEGER NULL,
  ADD COLUMN `vehicleColor` VARCHAR(191) NULL,
  ADD COLUMN `serviceAreas` JSON NULL,
  ADD COLUMN `experience` VARCHAR(191) NULL,
  ADD COLUMN `bio` TEXT NULL;

ALTER TABLE `TransportRequest`
  MODIFY `vehicleType` ENUM('MOTORBIKE','CAR','SUV','VAN','TRUCK_SMALL','TRUCK_MEDIUM','TRUCK_LARGE') NOT NULL,
  MODIFY `propertyId` VARCHAR(191) NULL,
  ADD COLUMN `scheduledAt` DATETIME(3) NULL;

ALTER TABLE `PricingRule`
  MODIFY `vehicleType` ENUM('MOTORBIKE','CAR','SUV','VAN','TRUCK_SMALL','TRUCK_MEDIUM','TRUCK_LARGE') NOT NULL;

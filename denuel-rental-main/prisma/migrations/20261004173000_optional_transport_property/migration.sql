-- General rides, deliveries and moving requests are not always tied to a property.
ALTER TABLE `TransportRequest`
  DROP FOREIGN KEY `TransportRequest_propertyId_fkey`;

ALTER TABLE `TransportRequest`
  MODIFY COLUMN `propertyId` VARCHAR(191) NULL;

ALTER TABLE `TransportRequest`
  ADD CONSTRAINT `TransportRequest_propertyId_fkey`
  FOREIGN KEY (`propertyId`) REFERENCES `Property`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `MessageThread`
  ADD COLUMN `clientId` VARCHAR(191) NULL;

CREATE INDEX `MessageThread_clientId_idx`
  ON `MessageThread`(`clientId`);

CREATE UNIQUE INDEX `MessageThread_propertyId_clientId_key`
  ON `MessageThread`(`propertyId`, `clientId`);

ALTER TABLE `MessageThread`
  ADD CONSTRAINT `MessageThread_clientId_fkey`
  FOREIGN KEY (`clientId`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

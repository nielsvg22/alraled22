-- Handmatige migratie: shipping velden toevoegen aan Order + SendcloudConfig tabel
-- Voer dit uit in de Railway MySQL database (via phpMyAdmin, MySQL Workbench, of de Railway Shell met mysql client)

-- Shipping velden toevoegen aan Order tabel
ALTER TABLE `Order`
  ADD COLUMN IF NOT EXISTS `shippingName` varchar(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `shippingCompany` varchar(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `shippingAddress` varchar(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `shippingPostcode` varchar(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `shippingCity` varchar(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `shippingCountry` varchar(2) DEFAULT 'NL',
  ADD COLUMN IF NOT EXISTS `shippingPhone` varchar(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `shippingMethod` varchar(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `shippingCost` double NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `trackingNumber` varchar(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `trackingUrl` varchar(512) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `sendcloudShipmentId` varchar(50) DEFAULT NULL;

-- Quote status uitbreiden (voor nieuwe statussen)
-- Alleen uitvoeren als de enum nog niet bestaat:
-- ALTER TABLE `Quote` MODIFY COLUMN `status` enum('NEW','VIEWED','CONTACTED','CONVERTED','ARCHIVED') NOT NULL DEFAULT 'NEW';

-- SendcloudConfig tabel aanmaken (als die nog niet bestaat)
CREATE TABLE IF NOT EXISTS `SendcloudConfig` (
  `key` varchar(255) NOT NULL,
  `value` text NOT NULL,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `AnalyticsEvent` (
	`id` varchar(36) NOT NULL,
	`visitId` varchar(36) NOT NULL,
	`type` enum('click','view','form_submit','purchase','add_to_cart','remove_from_cart','checkout_start','checkout_complete','error') NOT NULL,
	`category` varchar(100),
	`action` varchar(100),
	`label` text,
	`value` double,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `AnalyticsEvent_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Category` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`imageUrl` varchar(512),
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `Category_id` PRIMARY KEY(`id`),
	CONSTRAINT `Category_name_unique` UNIQUE(`name`),
	CONSTRAINT `Category_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `CustomerGroup` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`discountPercent` double NOT NULL DEFAULT 0,
	`vatReverseCharge` int NOT NULL DEFAULT 0,
	`netPrices` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `CustomerGroup_id` PRIMARY KEY(`id`),
	CONSTRAINT `CustomerGroup_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `DiscountCode` (
	`id` varchar(36) NOT NULL,
	`code` varchar(50) NOT NULL,
	`type` enum('PERCENTAGE','FIXED') NOT NULL DEFAULT 'PERCENTAGE',
	`value` double NOT NULL,
	`minOrderAmount` double NOT NULL DEFAULT 0,
	`startDate` timestamp,
	`endDate` timestamp,
	`usageLimit` int,
	`usageCount` int NOT NULL DEFAULT 0,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `DiscountCode_id` PRIMARY KEY(`id`),
	CONSTRAINT `DiscountCode_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `Notification` (
	`id` varchar(36) NOT NULL,
	`type` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`link` varchar(512),
	`read` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `Notification_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `OrderItem` (
	`id` varchar(36) NOT NULL,
	`orderId` varchar(36) NOT NULL,
	`productId` varchar(36),
	`quantity` int NOT NULL,
	`price` double NOT NULL,
	CONSTRAINT `OrderItem_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Order` (
	`id` varchar(36) NOT NULL,
	`userId` varchar(36) NOT NULL,
	`total` double NOT NULL,
	`discountCodeId` varchar(36),
	`discountAmount` double NOT NULL DEFAULT 0,
	`status` enum('PENDING','PROCESSING','SHIPPED','DELIVERED','CANCELLED') NOT NULL DEFAULT 'PENDING',
	`shippingName` varchar(255),
	`shippingCompany` varchar(255),
	`shippingAddress` varchar(255),
	`shippingPostcode` varchar(20),
	`shippingCity` varchar(100),
	`shippingCountry` varchar(2) DEFAULT 'NL',
	`shippingPhone` varchar(50),
	`shippingMethod` varchar(100),
	`shippingCost` double NOT NULL DEFAULT 0,
	`trackingNumber` varchar(255),
	`trackingUrl` varchar(512),
	`sendcloudShipmentId` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `Order_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `PageView` (
	`id` varchar(36) NOT NULL,
	`visitId` varchar(36) NOT NULL,
	`url` text NOT NULL,
	`title` text,
	`referrer` text,
	`timeOnPage` int DEFAULT 0,
	`scrollDepth` int DEFAULT 0,
	`isExit` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `PageView_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Payment` (
	`id` varchar(36) NOT NULL,
	`orderId` varchar(36) NOT NULL,
	`molliePaymentId` varchar(255),
	`molliePaymentUrl` varchar(512),
	`amount` double NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'EUR',
	`method` varchar(50),
	`status` enum('PENDING','OPEN','CANCELLED','EXPIRED','FAILED','PAID') NOT NULL DEFAULT 'PENDING',
	`paidAt` timestamp,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `Payment_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ProductImage` (
	`id` varchar(36) NOT NULL,
	`productId` varchar(36) NOT NULL,
	`url` varchar(512) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ProductImage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ProductPriceTier` (
	`id` varchar(36) NOT NULL,
	`productId` varchar(36) NOT NULL,
	`minQty` int NOT NULL,
	`price` double NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ProductPriceTier_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ProductRelation` (
	`id` varchar(36) NOT NULL,
	`productId` varchar(36) NOT NULL,
	`relatedProductId` varchar(36) NOT NULL,
	`type` enum('UPSELL','CROSS_SELL','RELATED') NOT NULL DEFAULT 'RELATED',
	CONSTRAINT `ProductRelation_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Product` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`specs` text,
	`price` double NOT NULL,
	`stock` int NOT NULL DEFAULT 0,
	`imageUrl` varchar(512),
	`category` varchar(255),
	`categoryId` varchar(36),
	`pdfUrl` varchar(512),
	`videoUrl` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `Product_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Quote` (
	`id` varchar(36) NOT NULL,
	`quoteNumber` varchar(50),
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(50),
	`company` varchar(255),
	`address` varchar(255),
	`postcode` varchar(20),
	`city` varchar(100),
	`message` text,
	`items` text NOT NULL,
	`total` double NOT NULL DEFAULT 0,
	`subtotal` double NOT NULL DEFAULT 0,
	`vat` double NOT NULL DEFAULT 0,
	`status` enum('NEW','VIEWED','CONTACTED','CONVERTED','ARCHIVED') NOT NULL DEFAULT 'NEW',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `Quote_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `RmaItem` (
	`id` varchar(36) NOT NULL,
	`rmaId` varchar(36) NOT NULL,
	`orderItemId` varchar(36) NOT NULL,
	`quantity` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `RmaItem_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Rma` (
	`id` varchar(36) NOT NULL,
	`orderId` varchar(36) NOT NULL,
	`userId` varchar(36) NOT NULL,
	`status` enum('REQUESTED','APPROVED','REJECTED','RECEIVED','REFUNDED','CLOSED') NOT NULL DEFAULT 'REQUESTED',
	`reason` text,
	`message` text,
	`adminNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `Rma_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `SendcloudConfig` (
	`key` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `SendcloudConfig_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `SiteContent` (
	`key` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `SiteContent_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `SnelstartConfig` (
	`id` varchar(36) NOT NULL,
	`apiKey` varchar(255),
	`clientKey` varchar(255),
	`ledgerNumberSales` varchar(50),
	`ledgerNumberVat21` varchar(50),
	`ledgerNumberVat9` varchar(50),
	`ledgerNumberVat0` varchar(50),
	`ledgerNumberShipping` varchar(50),
	`snelstartVatCode21` varchar(50),
	`snelstartVatCode9` varchar(50),
	`snelstartVatCode0` varchar(50),
	`enabled` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `SnelstartConfig_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `SnelstartLedger` (
	`id` varchar(36) NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('SALES','VAT','SHIPPING','OTHER') NOT NULL DEFAULT 'OTHER',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `SnelstartLedger_id` PRIMARY KEY(`id`),
	CONSTRAINT `SnelstartLedger_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `SnelstartSyncLog` (
	`id` varchar(36) NOT NULL,
	`orderId` varchar(36) NOT NULL,
	`status` enum('SUCCESS','FAILED') NOT NULL,
	`errorMessage` text,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `SnelstartSyncLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `SystemLog` (
	`id` varchar(36) NOT NULL,
	`type` varchar(50) NOT NULL,
	`level` enum('INFO','WARN','ERROR') NOT NULL DEFAULT 'INFO',
	`source` varchar(100) NOT NULL,
	`message` text NOT NULL,
	`details` text,
	`orderId` varchar(36),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `SystemLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `User` (
	`id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`name` varchar(255),
	`role` enum('USER','ADMIN') NOT NULL DEFAULT 'USER',
	`customerGroupId` varchar(36),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `User_id` PRIMARY KEY(`id`),
	CONSTRAINT `User_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `Visit` (
	`id` varchar(36) NOT NULL,
	`sessionId` varchar(255) NOT NULL,
	`userAgent` text,
	`ip` varchar(45),
	`referrer` text,
	`utmSource` varchar(255),
	`utmMedium` varchar(255),
	`utmCampaign` varchar(255),
	`country` varchar(2),
	`city` varchar(100),
	`device` varchar(50),
	`browser` varchar(50),
	`os` varchar(50),
	`isNewVisitor` int NOT NULL DEFAULT 1,
	`landingPage` text,
	`exitPage` text,
	`duration` int DEFAULT 0,
	`pageViews` int NOT NULL DEFAULT 0,
	`converted` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `Visit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `AnalyticsEvent` ADD CONSTRAINT `AnalyticsEvent_visitId_Visit_id_fk` FOREIGN KEY (`visitId`) REFERENCES `Visit`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_orderId_Order_id_fk` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_productId_Product_id_fk` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Order` ADD CONSTRAINT `Order_userId_User_id_fk` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Order` ADD CONSTRAINT `Order_discountCodeId_DiscountCode_id_fk` FOREIGN KEY (`discountCodeId`) REFERENCES `DiscountCode`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `PageView` ADD CONSTRAINT `PageView_visitId_Visit_id_fk` FOREIGN KEY (`visitId`) REFERENCES `Visit`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_orderId_Order_id_fk` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ProductImage` ADD CONSTRAINT `ProductImage_productId_Product_id_fk` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ProductPriceTier` ADD CONSTRAINT `ProductPriceTier_productId_Product_id_fk` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ProductRelation` ADD CONSTRAINT `ProductRelation_productId_Product_id_fk` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ProductRelation` ADD CONSTRAINT `ProductRelation_relatedProductId_Product_id_fk` FOREIGN KEY (`relatedProductId`) REFERENCES `Product`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Product` ADD CONSTRAINT `Product_categoryId_Category_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `RmaItem` ADD CONSTRAINT `RmaItem_rmaId_Rma_id_fk` FOREIGN KEY (`rmaId`) REFERENCES `Rma`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `RmaItem` ADD CONSTRAINT `RmaItem_orderItemId_OrderItem_id_fk` FOREIGN KEY (`orderItemId`) REFERENCES `OrderItem`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Rma` ADD CONSTRAINT `Rma_orderId_Order_id_fk` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Rma` ADD CONSTRAINT `Rma_userId_User_id_fk` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `SnelstartSyncLog` ADD CONSTRAINT `SnelstartSyncLog_orderId_Order_id_fk` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `User` ADD CONSTRAINT `User_customerGroupId_CustomerGroup_id_fk` FOREIGN KEY (`customerGroupId`) REFERENCES `CustomerGroup`(`id`) ON DELETE set null ON UPDATE no action;
CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('high_risk','opportunity','macro_change','model_drift','system') NOT NULL,
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'info',
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`sector` varchar(64),
	`status` enum('active','monitoring','exited','watchlist') NOT NULL DEFAULT 'active',
	`predictionId` int,
	`notes` text,
	`investmentAmount` decimal(18,2),
	`currency` varchar(8) DEFAULT 'KES',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `macroCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`indicator` varchar(64) NOT NULL,
	`value` float NOT NULL,
	`source` varchar(64),
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `macroCache_id` PRIMARY KEY(`id`),
	CONSTRAINT `macroCache_indicator_unique` UNIQUE(`indicator`)
);
--> statement-breakpoint
CREATE TABLE `portfolios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`totalCompanies` int NOT NULL DEFAULT 0,
	`avgRisk` float,
	`portfolioIrr` float,
	`totalAum` decimal(18,2),
	`currency` varchar(8) DEFAULT 'KES',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `predictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`gdpGrowth` float NOT NULL,
	`inflation` float NOT NULL,
	`revenueGrowth` float NOT NULL,
	`debtRatio` float NOT NULL,
	`volatility` float NOT NULL,
	`sector` varchar(64),
	`dealName` varchar(255),
	`riskScore` float NOT NULL,
	`predictedIrr` float NOT NULL,
	`confidence` float DEFAULT 0.85,
	`riskLabel` varchar(32),
	`riskAdjustedReturn` float,
	`sharpeProxy` float,
	`shapValues` json,
	`modelVersion` varchar(32) DEFAULT '1.0.0',
	`isBatch` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `predictions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tier` enum('free','pro','enterprise') NOT NULL DEFAULT 'free',
	`stripeCustomerId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`status` enum('active','cancelled','past_due','trialing') NOT NULL DEFAULT 'active',
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('analyst','investor','admin') NOT NULL DEFAULT 'analyst';--> statement-breakpoint
ALTER TABLE `users` ADD `firm` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `language` enum('en','sw') DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `darkMode` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `tier` enum('free','pro','enterprise') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `predictionsUsed` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `predictionsResetAt` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `notifyEmail` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `notifySms` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `dpaConsent` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `dpaConsentAt` timestamp;
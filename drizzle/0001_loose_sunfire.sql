CREATE TABLE `analysisCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stockCode` varchar(6) NOT NULL,
	`technicalScore` int,
	`technicalSignals` text,
	`sentimentScore` int,
	`sentimentData` text,
	`capitalScore` int,
	`capitalData` text,
	`summary` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `analysisCache_id` PRIMARY KEY(`id`),
	CONSTRAINT `analysisCache_stockCode_unique` UNIQUE(`stockCode`)
);
--> statement-breakpoint
CREATE TABLE `klines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stockCode` varchar(6) NOT NULL,
	`period` varchar(10) NOT NULL,
	`tradeDate` varchar(10) NOT NULL,
	`open` varchar(20) NOT NULL,
	`high` varchar(20) NOT NULL,
	`low` varchar(20) NOT NULL,
	`close` varchar(20) NOT NULL,
	`volume` varchar(30) NOT NULL,
	`amount` varchar(30),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `klines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(6) NOT NULL,
	`name` varchar(100) NOT NULL,
	`market` varchar(2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stocks_id` PRIMARY KEY(`id`),
	CONSTRAINT `stocks_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `watchlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stockCode` varchar(6) NOT NULL,
	`targetPrice` varchar(20),
	`note` text,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	`source` varchar(20) NOT NULL DEFAULT 'manual',
	CONSTRAINT `watchlist_id` PRIMARY KEY(`id`)
);

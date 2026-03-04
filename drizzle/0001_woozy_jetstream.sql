CREATE TABLE `lyrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`songId` int NOT NULL,
	`language` varchar(10) DEFAULT 'pt',
	`lrcContent` text NOT NULL,
	`version` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lyrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`songId` int NOT NULL,
	`score` int NOT NULL,
	`pitchAccuracy` int,
	`timingAccuracy` int,
	`consistencyScore` int,
	`recordingUrl` text,
	`duration` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `performances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `songs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`artist` varchar(255) NOT NULL,
	`album` varchar(255),
	`duration` int NOT NULL,
	`instrumentalUrl` text NOT NULL,
	`originalUrl` text,
	`coverImageUrl` text,
	`genre` varchar(100),
	`difficulty` enum('easy','medium','hard') DEFAULT 'medium',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `songs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `lyrics` ADD CONSTRAINT `lyrics_songId_songs_id_fk` FOREIGN KEY (`songId`) REFERENCES `songs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `performances` ADD CONSTRAINT `performances_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `performances` ADD CONSTRAINT `performances_songId_songs_id_fk` FOREIGN KEY (`songId`) REFERENCES `songs`(`id`) ON DELETE cascade ON UPDATE no action;
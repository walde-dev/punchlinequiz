CREATE TABLE `punchlinequiz_account` (
	`user_id` text(255) NOT NULL,
	`type` text(255) NOT NULL,
	`provider` text(255) NOT NULL,
	`provider_account_id` text(255) NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text(255),
	`scope` text(255),
	`id_token` text,
	`session_state` text(255),
	PRIMARY KEY(`provider`, `provider_account_id`),
	FOREIGN KEY (`user_id`) REFERENCES `punchlinequiz_user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `account_user_id_idx` ON `punchlinequiz_account` (`user_id`);--> statement-breakpoint
CREATE TABLE `punchlinequiz_album` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`image` text,
	`release_date` text,
	`spotify_url` text,
	`artist_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`artist_id`) REFERENCES `punchlinequiz_artist`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `album_name_idx` ON `punchlinequiz_album` (`name`);--> statement-breakpoint
CREATE INDEX `album_artist_idx` ON `punchlinequiz_album` (`artist_id`);--> statement-breakpoint
CREATE TABLE `punchlinequiz_artist` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`image` text,
	`spotify_url` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `artist_name_idx` ON `punchlinequiz_artist` (`name`);--> statement-breakpoint
CREATE TABLE `punchlinequiz_post` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(256),
	`created_by` text(255) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`created_by`) REFERENCES `punchlinequiz_user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `created_by_idx` ON `punchlinequiz_post` (`created_by`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `punchlinequiz_post` (`name`);--> statement-breakpoint
CREATE TABLE `punchlinequiz_punchline` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`line` text NOT NULL,
	`perfect_solution` text NOT NULL,
	`acceptable_solutions` text NOT NULL,
	`song_id` text NOT NULL,
	`created_by` text(255) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`song_id`) REFERENCES `punchlinequiz_song`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `punchlinequiz_user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `punchline_created_by_idx` ON `punchlinequiz_punchline` (`created_by`);--> statement-breakpoint
CREATE INDEX `punchline_song_idx` ON `punchlinequiz_punchline` (`song_id`);--> statement-breakpoint
CREATE TABLE `punchlinequiz_session` (
	`session_token` text(255) PRIMARY KEY NOT NULL,
	`userId` text(255) NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `punchlinequiz_user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `punchlinequiz_session` (`userId`);--> statement-breakpoint
CREATE TABLE `punchlinequiz_song` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`spotify_url` text,
	`album_id` text NOT NULL,
	`artist_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`album_id`) REFERENCES `punchlinequiz_album`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`artist_id`) REFERENCES `punchlinequiz_artist`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `song_name_idx` ON `punchlinequiz_song` (`name`);--> statement-breakpoint
CREATE INDEX `song_album_idx` ON `punchlinequiz_song` (`album_id`);--> statement-breakpoint
CREATE INDEX `song_artist_idx` ON `punchlinequiz_song` (`artist_id`);--> statement-breakpoint
CREATE TABLE `punchlinequiz_user` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`name` text(255),
	`email` text(255) NOT NULL,
	`email_verified` integer DEFAULT (unixepoch()),
	`image` text(255),
	`is_admin` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `punchlinequiz_verification_token` (
	`identifier` text(255) NOT NULL,
	`token` text(255) NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);

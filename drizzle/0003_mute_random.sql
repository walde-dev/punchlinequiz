CREATE TABLE `punchlinequiz_anonymous_activity` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` text NOT NULL,
	`type` text NOT NULL,
	`punchline_id` integer,
	`guess` text,
	`timestamp` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `punchlinequiz_anonymous_session`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`punchline_id`) REFERENCES `punchlinequiz_punchline`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `anonymous_activity_session_idx` ON `punchlinequiz_anonymous_activity` (`session_id`);--> statement-breakpoint
CREATE INDEX `anonymous_activity_type_idx` ON `punchlinequiz_anonymous_activity` (`type`);--> statement-breakpoint
CREATE INDEX `anonymous_activity_timestamp_idx` ON `punchlinequiz_anonymous_activity` (`timestamp`);--> statement-breakpoint
CREATE TABLE `punchlinequiz_anonymous_session` (
	`id` text PRIMARY KEY NOT NULL,
	`fingerprint` text NOT NULL,
	`first_seen_at` integer DEFAULT (unixepoch()) NOT NULL,
	`last_seen_at` integer DEFAULT (unixepoch()) NOT NULL,
	`total_plays` integer DEFAULT 0 NOT NULL,
	`correct_guesses` integer DEFAULT 0 NOT NULL,
	`converted_to_user` text,
	FOREIGN KEY (`converted_to_user`) REFERENCES `punchlinequiz_user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `anonymous_session_fingerprint_idx` ON `punchlinequiz_anonymous_session` (`fingerprint`);--> statement-breakpoint
CREATE INDEX `anonymous_session_converted_user_idx` ON `punchlinequiz_anonymous_session` (`converted_to_user`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_punchlinequiz_solved_punchline` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text(255) NOT NULL,
	`punchline_id` integer NOT NULL,
	`solution` text NOT NULL,
	`solved_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `punchlinequiz_user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`punchline_id`) REFERENCES `punchlinequiz_punchline`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_punchlinequiz_solved_punchline`("id", "user_id", "punchline_id", "solution", "solved_at") SELECT "id", "user_id", "punchline_id", "solution", "solved_at" FROM `punchlinequiz_solved_punchline`;--> statement-breakpoint
DROP TABLE `punchlinequiz_solved_punchline`;--> statement-breakpoint
ALTER TABLE `__new_punchlinequiz_solved_punchline` RENAME TO `punchlinequiz_solved_punchline`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `solved_punchline_user_idx` ON `punchlinequiz_solved_punchline` (`user_id`);--> statement-breakpoint
CREATE INDEX `solved_punchline_punchline_idx` ON `punchlinequiz_solved_punchline` (`punchline_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `solved_punchline_unique_idx` ON `punchlinequiz_solved_punchline` (`user_id`,`punchline_id`);
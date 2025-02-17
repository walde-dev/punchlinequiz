CREATE TABLE `punchlinequiz_solved_punchline` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text(255) NOT NULL,
	`punchline_id` integer NOT NULL,
	`solution` text NOT NULL,
	`solved_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`user_id`, `punchline_id`),
	FOREIGN KEY (`user_id`) REFERENCES `punchlinequiz_user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`punchline_id`) REFERENCES `punchlinequiz_punchline`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `solved_punchline_user_idx` ON `punchlinequiz_solved_punchline` (`user_id`);--> statement-breakpoint
CREATE INDEX `solved_punchline_punchline_idx` ON `punchlinequiz_solved_punchline` (`punchline_id`);
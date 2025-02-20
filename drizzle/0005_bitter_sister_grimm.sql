CREATE TABLE `punchlinequiz_quiz_guesses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` text NOT NULL,
	`punchline_id` integer NOT NULL,
	`artist_id` text NOT NULL,
	`is_correct` integer NOT NULL,
	`user_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `punchlinequiz_anonymous_session`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`punchline_id`) REFERENCES `punchlinequiz_punchline`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`artist_id`) REFERENCES `punchlinequiz_artist`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `punchlinequiz_user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `quiz_guesses_session_idx` ON `punchlinequiz_quiz_guesses` (`session_id`);--> statement-breakpoint
CREATE INDEX `quiz_guesses_punchline_idx` ON `punchlinequiz_quiz_guesses` (`punchline_id`);--> statement-breakpoint
CREATE INDEX `quiz_guesses_artist_idx` ON `punchlinequiz_quiz_guesses` (`artist_id`);--> statement-breakpoint
CREATE INDEX `quiz_guesses_user_idx` ON `punchlinequiz_quiz_guesses` (`user_id`);
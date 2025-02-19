CREATE TABLE `punchlinequiz_quiz_punchline` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`line` text NOT NULL,
	`song_id` text NOT NULL,
	`correct_artist_id` text NOT NULL,
	`wrong_artist_1_id` text NOT NULL,
	`wrong_artist_2_id` text NOT NULL,
	`created_by` text(255) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`song_id`) REFERENCES `punchlinequiz_song`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`correct_artist_id`) REFERENCES `punchlinequiz_artist`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`wrong_artist_1_id`) REFERENCES `punchlinequiz_artist`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`wrong_artist_2_id`) REFERENCES `punchlinequiz_artist`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `punchlinequiz_user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `quiz_punchline_created_by_idx` ON `punchlinequiz_quiz_punchline` (`created_by`);--> statement-breakpoint
CREATE INDEX `quiz_punchline_song_idx` ON `punchlinequiz_quiz_punchline` (`song_id`);
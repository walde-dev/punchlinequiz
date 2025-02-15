ALTER TABLE `punchlinequiz_post` RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE `punchlinequiz_punchline` RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE `punchlinequiz_user` ADD `onboarding_completed` integer DEFAULT false NOT NULL;
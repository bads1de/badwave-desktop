CREATE TABLE `spotlights` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`author` text NOT NULL,
	`description` text,
	`genre` text,
	`original_video_path` text,
	`original_thumbnail_path` text,
	`video_path` text,
	`thumbnail_path` text,
	`created_at` text,
	`downloaded_at` integer
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_section_cache` (
	`key` text PRIMARY KEY NOT NULL,
	`item_ids` text,
	`updated_at` integer DEFAULT '"2025-12-30T05:40:44.704Z"'
);
--> statement-breakpoint
INSERT INTO `__new_section_cache`("key", "item_ids", "updated_at") SELECT "key", "song_ids", "updated_at" FROM `section_cache`;--> statement-breakpoint
DROP TABLE `section_cache`;--> statement-breakpoint
ALTER TABLE `__new_section_cache` RENAME TO `section_cache`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
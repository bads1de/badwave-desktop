PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_section_cache` (
	`key` text PRIMARY KEY NOT NULL,
	`item_ids` text,
	`updated_at` integer DEFAULT '"2025-12-30T23:03:54.508Z"'
);
--> statement-breakpoint
INSERT INTO `__new_section_cache`("key", "item_ids", "updated_at") SELECT "key", "item_ids", "updated_at" FROM `section_cache`;--> statement-breakpoint
DROP TABLE `section_cache`;--> statement-breakpoint
ALTER TABLE `__new_section_cache` RENAME TO `section_cache`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `songs` ADD `play_count` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `songs` ADD `like_count` integer DEFAULT 0;
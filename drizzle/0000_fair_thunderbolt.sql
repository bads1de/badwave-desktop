CREATE TABLE `liked_songs` (
	`user_id` text NOT NULL,
	`song_id` text NOT NULL,
	`liked_at` text DEFAULT 'now',
	PRIMARY KEY(`user_id`, `song_id`),
	FOREIGN KEY (`song_id`) REFERENCES `songs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `playlist_songs` (
	`id` text PRIMARY KEY NOT NULL,
	`playlist_id` text NOT NULL,
	`song_id` text NOT NULL,
	`added_at` text,
	FOREIGN KEY (`playlist_id`) REFERENCES `playlists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`song_id`) REFERENCES `songs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `playlists` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`image_path` text,
	`is_public` integer DEFAULT false,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `songs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`author` text NOT NULL,
	`song_path` text,
	`image_path` text,
	`original_song_path` text,
	`original_image_path` text,
	`duration` real,
	`genre` text,
	`lyrics` text,
	`created_at` text,
	`downloaded_at` integer,
	`last_played_at` integer
);

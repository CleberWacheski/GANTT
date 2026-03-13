ALTER TABLE `files` ADD `size` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `files` ADD `mime_type` text DEFAULT 'application/octet-stream' NOT NULL;
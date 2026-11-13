CREATE TYPE "lead_priority" AS ENUM('A', 'B', 'C');--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "priority" "lead_priority";--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "hook" varchar(300);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "preview_url" varchar(500);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "maps_url" varchar(500);
ALTER TABLE "proposals" ADD COLUMN "bonuses" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "proposals" DROP COLUMN "bonus";
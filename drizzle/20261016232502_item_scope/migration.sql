ALTER TABLE "proposal_items" ADD COLUMN "scope" jsonb;--> statement-breakpoint
ALTER TABLE "proposals" DROP COLUMN "scope";
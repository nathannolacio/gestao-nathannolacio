CREATE TABLE "prospecting_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"offer" varchar(20) NOT NULL,
	"niche" varchar(60) NOT NULL,
	"cities" varchar(200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "batch_id" uuid;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "lead_id" uuid;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_batch_id_prospecting_batches_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "prospecting_batches"("id");--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_lead_id_leads_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id");
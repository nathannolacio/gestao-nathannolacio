CREATE TABLE "proposal_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"proposal_id" uuid NOT NULL,
	"channel" "contact_channel" NOT NULL,
	"note" varchar(500),
	"client_replied" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"proposal_id" uuid NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "next_follow_up_at" date;--> statement-breakpoint
ALTER TABLE "proposal_contacts" ADD CONSTRAINT "proposal_contacts_proposal_id_proposals_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id");--> statement-breakpoint
ALTER TABLE "proposal_views" ADD CONSTRAINT "proposal_views_proposal_id_proposals_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id");
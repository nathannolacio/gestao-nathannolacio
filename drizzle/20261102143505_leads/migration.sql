CREATE TYPE "contact_channel" AS ENUM('whatsapp', 'call', 'email', 'dm', 'in_person');--> statement-breakpoint
CREATE TYPE "lead_source" AS ENUM('prospecting', 'referral', 'instagram', 'google', 'site', 'other');--> statement-breakpoint
CREATE TYPE "lead_stage" AS ENUM('new', 'contacted', 'talking', 'diagnosis', 'proposal', 'won', 'lost');--> statement-breakpoint
CREATE TABLE "lead_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"lead_id" uuid NOT NULL,
	"channel" "contact_channel" NOT NULL,
	"note" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"business_name" varchar(100) NOT NULL,
	"contact_name" varchar(100),
	"segment" varchar(60),
	"city" varchar(100),
	"phone_number" varchar(13),
	"instagram" varchar(60),
	"source" "lead_source" DEFAULT 'prospecting'::"lead_source" NOT NULL,
	"referred_by" varchar(100),
	"stage" "lead_stage" DEFAULT 'new'::"lead_stage" NOT NULL,
	"lost_reason" varchar(200),
	"next_follow_up_at" date,
	"notes" text,
	"diagnosis" jsonb,
	"client_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "lead_contacts" ADD CONSTRAINT "lead_contacts_lead_id_leads_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id");--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_client_id_clients_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id");
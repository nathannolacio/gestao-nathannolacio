CREATE TYPE "client_type" AS ENUM('PF', 'PJ');--> statement-breakpoint
CREATE TYPE "discount_type" AS ENUM('percentage', 'fixed');--> statement-breakpoint
CREATE TYPE "proposal_status" AS ENUM('draft', 'sent', 'approved');--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"type" "client_type" NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(256) NOT NULL,
	"phone_number" varchar(13) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "proposal_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"proposal_id" uuid NOT NULL,
	"description" varchar(200) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"discount_type" "discount_type",
	"discount_value" integer,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"content" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"public_token" varchar(24) NOT NULL UNIQUE,
	"client_id" uuid NOT NULL,
	"title" varchar(100) NOT NULL,
	"deleted_at" timestamp with time zone,
	"bonus" text,
	"delivery_days" integer NOT NULL,
	"discount_type" "discount_type",
	"discount_value" integer,
	"hosting_annual" integer,
	"fixed_content" jsonb NOT NULL,
	"status" "proposal_status" DEFAULT 'draft'::"proposal_status" NOT NULL,
	"sent_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proposal_items" ADD CONSTRAINT "proposal_items_proposal_id_proposals_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id");--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_client_id_clients_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id");
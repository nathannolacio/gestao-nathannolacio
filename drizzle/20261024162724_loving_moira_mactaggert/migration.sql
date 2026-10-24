ALTER TABLE "clients" ADD COLUMN "legal_name" varchar(150);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "document" varchar(14);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "zip_code" varchar(8);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "street" varchar(150);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "address_number" varchar(20);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "address_complement" varchar(100);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "neighborhood" varchar(100);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "city" varchar(100);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "state" varchar(2);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "legal_rep_name" varchar(100);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "legal_rep_document" varchar(11);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "legal_rep_role" varchar(100);
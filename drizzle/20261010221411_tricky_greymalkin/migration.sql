CREATE TYPE "payment_method" AS ENUM('pix', 'split', 'card');--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "payment_method" "payment_method";
import { FixedContent } from "@/lib/proposal-content";
import { integer, jsonb, pgEnum, snakeCase, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const clientType = pgEnum("client_type", ["PF", "PJ"]);

export const clients = snakeCase.table("clients", {
    id: uuid().defaultRandom().primaryKey(),
    type: clientType().notNull(),
    name: varchar({ length:100 }).notNull(),
    email: varchar({ length:256 }).notNull(),
    phoneNumber: varchar({ length:13 }).notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp({ withTimezone: true }),
})

export const proposalTemplate = snakeCase.table("proposal_template", {
    id: uuid().defaultRandom().primaryKey(),
    content: jsonb().$type<FixedContent>().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
})

export const proposalStatusEnum = pgEnum("proposal_status", ["draft", "sent","approved"]);

export const discountTypeEnum = pgEnum("discount_type", ["percentage", "fixed"]);

export const proposals = snakeCase.table("proposals", {
    id: uuid().defaultRandom().primaryKey(),
    publicToken: varchar({ length:24 }).notNull().unique(),
    clientId: uuid().notNull().references(() => clients.id),
    title: varchar({ length:100 }).notNull(),
    deletedAt: timestamp({ withTimezone: true }),
    bonus: text(),
    deliveryDays: integer().notNull(),
    discountType: discountTypeEnum(),
    discountValue: integer(),
    hostingAnnual: integer(),
    fixedContent: jsonb().$type<FixedContent>().notNull(),
    status: proposalStatusEnum().default("draft").notNull(),
    sentAt: timestamp({ withTimezone: true }),
    approvedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
})

export const proposalItems = snakeCase.table("proposal_items", {
    id: uuid().defaultRandom().primaryKey(),
    proposalId: uuid().references(() => proposals.id).notNull(),
    description: varchar({ length:200 }).notNull(),
    quantity: integer().notNull(),
    unitPrice: integer().notNull(),
    discountType: discountTypeEnum(),
    discountValue: integer(),
    position: integer().notNull(),
})
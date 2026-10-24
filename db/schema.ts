import type { ProposalBonus } from "../lib/proposal-bonuses.ts";
import type { FixedContent } from "../lib/proposal-content.ts";
import type { ItemScope } from "../lib/proposal-scope.ts";
import { integer, jsonb, pgEnum, smallint, snakeCase, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { user } from "./auth-schema.ts";

export const clientType = pgEnum("client_type", ["PF", "PJ"]);

export const clients = snakeCase.table("clients", {
    id: uuid().defaultRandom().primaryKey(),
    type: clientType().notNull(),
    name: varchar({ length:100 }).notNull(),
    // Nulo até o cliente aprovar a proposta (pedido depois, para o contrato).
    email: varchar({ length:256 }),
    phoneNumber: varchar({ length:13 }).notNull(),
    // URL pública da logo (Vercel Blob). Nula = a capa mostra as iniciais.
    logoUrl: varchar({ length: 500 }),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp({ withTimezone: true }),
})

export const proposalTemplate = snakeCase.table("proposal_template", {
    id: uuid().defaultRandom().primaryKey(),
    content: jsonb().$type<FixedContent>().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
})

export const proposalStatusEnum = pgEnum("proposal_status", [
    "draft", "sent","approved"
]);

export const discountTypeEnum = pgEnum("discount_type", [
    "percentage", "fixed"
]);

export const paymentMethodEnum = pgEnum("payment_method", [
    "pix", "split", "card"
]);

export const proposals = snakeCase.table("proposals", {
    id: uuid().defaultRandom().primaryKey(),
    publicToken: varchar({ length:24 }).notNull().unique(),
    clientId: uuid().notNull().references(() => clients.id),
    title: varchar({ length:100 }).notNull(),
    deletedAt: timestamp({ withTimezone: true }),
    bonuses: jsonb().$type<ProposalBonus[]>().notNull().default([]),
    deliveryDays: integer().notNull(),
    discountType: discountTypeEnum(),
    discountValue: integer(),
    hostingMonthly: integer(),
    fixedContent: jsonb().$type<FixedContent>().notNull(),
    status: proposalStatusEnum().default("draft").notNull(),
    sentAt: timestamp({ withTimezone: true }),
    paymentMethod: paymentMethodEnum(),
    approvedAt: timestamp({ withTimezone: true }),
    cardInstallments: smallint(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
})

export const proposalItems = snakeCase.table("proposal_items", {
    id: uuid().defaultRandom().primaryKey(),
    proposalId: uuid().notNull().references(() => proposals.id),
    description: varchar({ length:200 }).notNull(),
    quantity: integer().notNull(),
    unitPrice: integer().notNull(),
    discountType: discountTypeEnum(),
    discountValue: integer(),
    scope: jsonb().$type<ItemScope>(),
    position: integer().notNull(),
})

// Inscrições de Web Push: um registro por aparelho/navegador do usuário.
// O endpoint é o endereço único (serviço de push da Apple/Google) para onde o
// servidor envia; p256dh e auth são as chaves para cifrar a mensagem.
export const pushSubscriptions = snakeCase.table("push_subscriptions", {
    id: uuid().defaultRandom().primaryKey(),
    userId: text().notNull().references(() => user.id, { onDelete: "cascade" }),
    endpoint: text().notNull().unique(),
    p256dh: text().notNull(),
    auth: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
})

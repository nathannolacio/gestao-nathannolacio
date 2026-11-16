import type { ProposalBonus } from "../lib/proposal-bonuses.ts";
import type { FixedContent } from "../lib/proposal-content.ts";
import type { ItemScope } from "../lib/proposal-scope.ts";
import type { LeadDiagnosis } from "../lib/leads.ts";
import type { ContractInputs } from "../lib/contracts.ts";
import { boolean, date, integer, jsonb, pgEnum, smallint, snakeCase, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
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
    // Dados do contrato (todos opcionais; preenchidos depois da aprovação).
    // `name` é o nome curto da capa; `legalName` é o nome completo / razão social.
    legalName: varchar({ length: 150 }),
    // CPF (11 dígitos, PF) ou CNPJ (14, PJ), só dígitos.
    document: varchar({ length: 14 }),
    zipCode: varchar({ length: 8 }),
    street: varchar({ length: 150 }),
    addressNumber: varchar({ length: 20 }),
    addressComplement: varchar({ length: 100 }),
    neighborhood: varchar({ length: 100 }),
    city: varchar({ length: 100 }),
    state: varchar({ length: 2 }),
    // Responsável legal (quem assina pela empresa; só PJ).
    legalRepName: varchar({ length: 100 }),
    legalRepDocument: varchar({ length: 11 }),
    legalRepRole: varchar({ length: 100 }),
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
    // Lead de origem (jornada comercial). Nulo em propostas criadas sem lead (ex.: antigas).
    leadId: uuid().references(() => leads.id),
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
    // Próximo lembrete de follow-up de uma proposta enviada (data em São Paulo, sem hora).
    nextFollowUpAt: date({ mode: "string" }),
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

// ---------------------------------------------------------------------------
// Leads (Fase 1 do sistema de gestão): prospecção, follow-up e diagnóstico.
// Um lead é um NEGÓCIO em negociação. Fica separado de `clients` para a lista de
// prospecção (dezenas de contatos frios) não se misturar com quem fechou.
// ---------------------------------------------------------------------------

// Funil: new → contacted → talking → diagnosis → proposal → won | lost.
export const leadStageEnum = pgEnum("lead_stage", [
    "new", "contacted", "talking", "diagnosis", "proposal", "won", "lost",
]);

export const leadSourceEnum = pgEnum("lead_source", [
    "prospecting", "referral", "instagram", "google", "site", "other",
]);

export const contactChannelEnum = pgEnum("contact_channel", [
    "whatsapp", "call", "email", "dm", "in_person",
]);

// Nota de prospecção (regra A/B/C da rotina de prospecção): A = prévia própria, B = demo do nicho, C = só se sobrar tempo.
export const leadPriorityEnum = pgEnum("lead_priority", ["A", "B", "C"]);

// Lotes de prospecção (etapa 1 da jornada): cada lista pedida ao Claude e importada vira um lote,
// para medir a resposta por nicho, cidade e oferta.
export const prospectingBatches = snakeCase.table("prospecting_batches", {
    id: uuid().defaultRandom().primaryKey(),
    // Chave de `prospectingOffers` (lib/prospecting-prompt.ts): "site" | "menu".
    offer: varchar({ length: 20 }).notNull(),
    niche: varchar({ length: 60 }).notNull(),
    cities: varchar({ length: 200 }).notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
})

export const leads = snakeCase.table("leads", {
    id: uuid().defaultRandom().primaryKey(),
    businessName: varchar({ length: 100 }).notNull(),
    contactName: varchar({ length: 100 }),
    segment: varchar({ length: 60 }),
    city: varchar({ length: 100 }),
    // Só dígitos (55 + DDD + número), igual a `clients.phone_number`. Opcional: às vezes só há o Instagram.
    phoneNumber: varchar({ length: 13 }),
    // Usuário do Instagram sem o "@".
    instagram: varchar({ length: 60 }),
    source: leadSourceEnum().default("prospecting").notNull(),
    // Quem indicou (texto livre: pode ser cliente, parente ou parceiro).
    referredBy: varchar({ length: 100 }),
    stage: leadStageEnum().default("new").notNull(),
    // Obrigatório quando stage = lost (regra no Zod).
    lostReason: varchar({ length: 200 }),
    // Data (sem hora) do próximo contato. Nula em ganho/perdido.
    nextFollowUpAt: date({ mode: "string" }),
    notes: text(),
    // Prospecção: nota A/B/C, gancho da 1ª mensagem e links (prévia feita para o lead e ficha do Google Maps).
    priority: leadPriorityEnum(),
    hook: varchar({ length: 300 }),
    previewUrl: varchar({ length: 500 }),
    mapsUrl: varchar({ length: 500 }),
    // Respostas do roteiro de diagnóstico, por id da pergunta (lib/leads.ts).
    diagnosis: jsonb().$type<LeadDiagnosis>(),
    // Preenchido quando a proposta é criada a partir do lead (o cliente nasce ali).
    clientId: uuid().references(() => clients.id),
    // Lote de prospecção que trouxe o lead (nulo para cadastro manual e importações antigas).
    batchId: uuid().references(() => prospectingBatches.id),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
    deletedAt: timestamp({ withTimezone: true }),
})

// Histórico de contatos de um lead (um registro por tentativa/conversa).
export const leadContacts = snakeCase.table("lead_contacts", {
    id: uuid().defaultRandom().primaryKey(),
    leadId: uuid().notNull().references(() => leads.id),
    channel: contactChannelEnum().notNull(),
    note: varchar({ length: 500 }),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
})

// Cada abertura da página pública da proposta por quem NÃO está logado (o cliente).
export const proposalViews = snakeCase.table("proposal_views", {
    id: uuid().defaultRandom().primaryKey(),
    proposalId: uuid().notNull().references(() => proposals.id),
    viewedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
})

// Follow-ups de uma proposta enviada (um registro por contato feito).
export const proposalContacts = snakeCase.table("proposal_contacts", {
    id: uuid().defaultRandom().primaryKey(),
    proposalId: uuid().notNull().references(() => proposals.id),
    channel: contactChannelEnum().notNull(),
    note: varchar({ length: 500 }),
    // true = o cliente respondeu neste contato (zera a contagem de tentativas sem resposta).
    clientReplied: boolean().default(false).notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
})

export const contractKindEnum = pgEnum("contract_kind", ["site", "catalog"]);

// Modelo de contrato editado em Configurações: um por tipo. Sem linha = vale o texto padrão do código
// (`lib/contract-defaults.ts`).
export const contractTemplates = snakeCase.table("contract_templates", {
    id: uuid().defaultRandom().primaryKey(),
    kind: contractKindEnum().notNull().unique(),
    body: text().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
})

// Contrato gerado para uma proposta. `body` é o texto FINAL, congelado na geração (editar o modelo
// depois não muda contrato já gerado). `inputs` guarda o que foi preenchido, para gerar de novo ou conferir.
export const contracts = snakeCase.table("contracts", {
    id: uuid().defaultRandom().primaryKey(),
    proposalId: uuid().notNull().references(() => proposals.id),
    kind: contractKindEnum().notNull(),
    body: text().notNull(),
    inputs: jsonb().$type<ContractInputs>().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp({ withTimezone: true }),
})

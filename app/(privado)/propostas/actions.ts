"use server"

import { requireUser } from "@/lib/auth"
import { proposalSchema, updateProposalSchema } from "@/lib/schemas/proposal";
import * as z from "zod";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { clients, leads, proposalItems, proposals } from "@/db/schema";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { bonusCatalog, isRequiredBonus } from "@/lib/proposal-bonuses";
import { projectSubtotal, toDiscount } from "@/lib/proposal-calc";
import { addDays, openLeadStages, todayInSaoPaulo } from "@/lib/leads";

// Erro esperado (não é falha do sistema): serve para abortar a transação (rollback)
// e ser convertido em retorno amigável fora dela.
class ClientNotFoundError extends Error {}
class LeadNotFoundError extends Error {}

// Depois de enviar a proposta, o lead ganha follow-up em 2 dias (a validade é de 7).
const FOLLOW_UP_AFTER_SEND_DAYS = 2;

const DISCOUNT_TOO_BIG = "O desconto geral não pode ser maior que o subtotal dos itens.";

// Desconto fixo geral não pode passar do subtotal (soma dos itens já com desconto).
// Só dá para conferir depois do Zod, com todos os itens validados.
function fixedDiscountExceedsSubtotal(data: {
    discountType?: "percentage" | "fixed";
    discountValue?: number;
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
        discountType?: "percentage" | "fixed";
        discountValue?: number;
    }[];
}) {
    if (data.discountType !== "fixed" || data.discountValue === undefined) return false;

    const subtotal = projectSubtotal(
        data.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: toDiscount(item.discountType ?? null, item.discountValue ?? null),
        })),
    );

    return data.discountValue > subtotal;
}

// A "foto" dos bônus vem do catálogo do servidor (o navegador manda só os ids).
// Os obrigatórios entram sempre.
function snapshotBonuses(ids: string[]) {
    return bonusCatalog.filter((b) => isRequiredBonus(b.id) || ids.includes(b.id));
}

export async function createProposal(input: unknown) {
    await requireUser();

    const result = proposalSchema.safeParse(input);

    if (!result.success) {
        const { fieldErrors } = z.flattenError(result.error);

        return { ok: false as const, fieldErrors, formError: null };
    }

    if (fixedDiscountExceedsSubtotal(result.data)) {
        return {
            ok: false as const,
            fieldErrors: {},
            formError: DISCOUNT_TOO_BIG,
        };
    }

    const bonuses = snapshotBonuses(result.data.bonuses);

    const publicToken = randomBytes(18).toString("base64url");

    try {
        await db.transaction(async (tx) => {
            let clientId: string;

            if (result.data.client.clientMode === "existing") {
                clientId = result.data.client.clientId;

            const queryResult = await tx.select()
                .from(clients)
                .where(
                    and(
                        eq(clients.id, clientId),
                        isNull(clients.deletedAt)
                    ))

                if (queryResult.length === 0) {
                    throw new ClientNotFoundError("Cliente não encontrado.")
                }

            } else {
                const name = result.data.client.name;
                const email = result.data.client.email;
                const phone = result.data.client.phone;
                const type = result.data.client.type;
                const logoUrl = result.data.client.logoUrl;

                const queryResult = await tx.insert(clients).values({
                    name,
                    email: email ?? null,
                    phoneNumber: phone,
                    type,
                    logoUrl,
                }).returning({ insertedId: clients.id })

                clientId = queryResult[0].insertedId;
            }

            // Lead de origem: precisa existir e estar ativo.
            const leadId = result.data.leadId ?? null;
            if (leadId) {
                const lead = await tx.query.leads.findFirst({
                    where: { id: leadId, deletedAt: { isNull: true } },
                    columns: { id: true },
                });
                if (!lead) throw new LeadNotFoundError("Lead não encontrado.");
            }

            const proposalTemplate = await tx.query.proposalTemplate.findFirst();

            if (!proposalTemplate) {
                throw new Error("O template não foi encontrado.")
            } 
            
            const content = proposalTemplate.content;

            const [proposal] = await tx.insert(proposals).values({
                publicToken,
                clientId,
                leadId,
                title: result.data.title,
                bonuses,
                deliveryDays: result.data.deliveryDays,
                discountType: result.data.discountType,
                discountValue: result.data.discountValue,
                hostingMonthly: result.data.hostingMonthly,
                fixedContent: content,
            }).returning({ id: proposals.id });

            // position = índice no array (ordem em que o usuário montou a lista)
            await tx.insert(proposalItems).values(
                result.data.items.map((item, index) => ({
                    proposalId: proposal.id,
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discountType: item.discountType,
                    discountValue: item.discountValue,
                    scope: item.scope,
                    position: index,
                })),
            );

            // O cliente nasce (ou é escolhido) aqui: o lead passa a apontar para ele.
            if (leadId) {
                await tx
                    .update(leads)
                    .set({ clientId })
                    .where(and(eq(leads.id, leadId), isNull(leads.clientId)));
            }
        })
    } catch (error) {
        if (error instanceof ClientNotFoundError) {
            return {
                ok: false as const,
                fieldErrors: {},
                formError: "Cliente não encontrado. Selecione outro cliente.",
            };
        }

        if (error instanceof LeadNotFoundError) {
            return {
                ok: false as const,
                fieldErrors: {},
                formError: "O lead desta proposta não existe mais. Crie a proposta pela ficha de outro lead.",
            };
        }

        throw error;
    }

    return { ok: true as const };
}

// Edita rascunho ou enviada (enviada: o cliente vê a mudança ao vivo pelo token).
// Aprovada NÃO edita, e o cliente da proposta nunca muda por aqui.
export async function updateProposal(input: unknown) {
    await requireUser();

    const result = updateProposalSchema.safeParse(input);

    if (!result.success) {
        const { fieldErrors } = z.flattenError(result.error);

        return { ok: false as const, fieldErrors, formError: null };
    }

    const data = result.data;

    if (fixedDiscountExceedsSubtotal(data)) {
        return { ok: false as const, fieldErrors: {}, formError: DISCOUNT_TOO_BIG };
    }

    const bonuses = snapshotBonuses(data.bonuses);

    const updated = await db.transaction(async (tx) => {
        // Status e exclusão conferidos no próprio UPDATE (atômico). Sem linha = não existe,
        // foi removida ou já está aprovada. `null` explícito limpa a coluna (undefined seria ignorado).
        const rows = await tx
            .update(proposals)
            .set({
                title: data.title,
                deliveryDays: data.deliveryDays,
                bonuses,
                hostingMonthly: data.hostingMonthly ?? null,
                discountType: data.discountType ?? null,
                discountValue: data.discountValue ?? null,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(proposals.id, data.id),
                    inArray(proposals.status, ["draft", "sent"]),
                    isNull(proposals.deletedAt),
                ),
            )
            .returning({ id: proposals.id, clientId: proposals.clientId });

        if (rows.length === 0) return false;

        // A logo é do cliente: trocar aqui vale para todas as propostas dele.
        // `undefined` = não mexe; `null` = remove.
        if (data.logoUrl !== undefined) {
            await tx
                .update(clients)
                .set({ logoUrl: data.logoUrl })
                .where(eq(clients.id, rows[0].clientId));
        }

        // Troca a lista inteira (mais simples que diff; `proposal_items` não tem soft delete).
        await tx.delete(proposalItems).where(eq(proposalItems.proposalId, data.id));
        await tx.insert(proposalItems).values(
            data.items.map((item, index) => ({
                proposalId: data.id,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discountType: item.discountType,
                discountValue: item.discountValue,
                scope: item.scope,
                position: index,
            })),
        );

        return true;
    });

    if (!updated) {
        return {
            ok: false as const,
            fieldErrors: {},
            formError: "Proposta não encontrada ou já aprovada (não pode mais ser editada).",
        };
    }

    revalidatePath("/propostas");

    return { ok: true as const };
}

const sendProposalSchema = z.object({ id: z.uuid() });

export async function sendProposal(input: unknown) {
    await requireUser();

    const result = sendProposalSchema.safeParse(input);

    if (!result.success) {
        return { ok: false as const, formError: "Proposta inválida." };
    }

    // A checagem do status e a troca acontecem num único UPDATE (atômico): se duas
    // requisições chegarem juntas, só uma encontra a linha ainda em "draft".
    // Na MESMA transação, o lead de origem avança para "Proposta enviada" (jornada comercial).
    const updated = await db.transaction(async (tx) => {
        const rows = await tx
            .update(proposals)
            .set({ status: "sent", sentAt: new Date(), updatedAt: new Date() })
            .where(
                and(
                    eq(proposals.id, result.data.id),
                    eq(proposals.status, "draft"),
                    isNull(proposals.deletedAt),
                ),
            )
            .returning({ id: proposals.id, leadId: proposals.leadId });

        const leadId = rows[0]?.leadId;
        if (leadId) {
            // Só mexe em lead ainda em aberto: ganho/perdido não volta para trás.
            await tx
                .update(leads)
                .set({
                    stage: "proposal",
                    nextFollowUpAt: addDays(todayInSaoPaulo(), FOLLOW_UP_AFTER_SEND_DAYS),
                })
                .where(
                    and(
                        eq(leads.id, leadId),
                        inArray(leads.stage, [...openLeadStages]),
                        isNull(leads.deletedAt),
                    ),
                );
        }

        return rows;
    });

    if (updated.length === 0) {
        return {
            ok: false as const,
            formError: "Proposta não encontrada ou já enviada.",
        };
    }

    revalidatePath("/propostas");
    revalidatePath("/leads");

    return { ok: true as const };
}

// Arquivar = soft delete (preenche deletedAt). Só rascunho e enviada; aprovada é registro
// de venda e não arquiva. Depois de arquivada, a página pública responde 404.
export async function archiveProposal(input: unknown) {
    await requireUser();

    const result = sendProposalSchema.safeParse(input);

    if (!result.success) {
        return { ok: false as const, formError: "Proposta inválida." };
    }

    const updated = await db
        .update(proposals)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(
            and(
                eq(proposals.id, result.data.id),
                inArray(proposals.status, ["draft", "sent"]),
                isNull(proposals.deletedAt),
            ),
        )
        .returning({ id: proposals.id });

    if (updated.length === 0) {
        return {
            ok: false as const,
            formError: "Proposta não encontrada, já arquivada ou aprovada.",
        };
    }

    revalidatePath("/propostas");

    return { ok: true as const };
}

// Só para testar em desenvolvimento: volta a proposta para rascunho e limpa envio/aprovação.
// Em produção a action recusa, porque não existe "desenviar" no fluxo real.
export async function revertToDraft(input: unknown) {
    if (process.env.NODE_ENV === "production") {
        throw new Error("Indisponível em produção.");
    }

    await requireUser();

    const result = sendProposalSchema.safeParse(input);

    if (!result.success) {
        return { ok: false as const, formError: "Proposta inválida." };
    }

    const updated = await db
        .update(proposals)
        .set({
            status: "draft",
            sentAt: null,
            approvedAt: null,
            paymentMethod: null,
            cardInstallments: null,
            updatedAt: new Date(),
        })
        .where(and(eq(proposals.id, result.data.id), isNull(proposals.deletedAt)))
        .returning({ id: proposals.id });

    if (updated.length === 0) {
        return { ok: false as const, formError: "Proposta não encontrada." };
    }

    revalidatePath("/propostas");

    return { ok: true as const };
}
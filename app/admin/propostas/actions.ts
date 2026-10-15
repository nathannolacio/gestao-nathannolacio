"use server"

import { requireUser } from "@/lib/auth"
import { proposalSchema } from "@/lib/schemas/proposal";
import * as z from "zod";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { clients, proposalItems, proposals } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { bonusCatalog, isRequiredBonus } from "@/lib/proposal-bonuses";
import { projectSubtotal, toDiscount } from "@/lib/proposal-calc";

// Erro esperado (não é falha do sistema): serve para abortar a transação (rollback)
// e ser convertido em retorno amigável fora dela.
class ClientNotFoundError extends Error {}

export async function createProposal(input: unknown) {
    await requireUser();

    const result = proposalSchema.safeParse(input);

    if (!result.success) {
        const { fieldErrors } = z.flattenError(result.error);

        return { ok: false as const, fieldErrors, formError: null };
    }

    // Desconto fixo geral não pode passar do subtotal (soma dos itens já com desconto).
    // Só dá para conferir aqui, com todos os itens validados.
    if (result.data.discountType === "fixed") {
        const subtotal = projectSubtotal(
            result.data.items.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: toDiscount(item.discountType ?? null, item.discountValue ?? null),
            })),
        );

        if (result.data.discountValue > subtotal) {
            return {
                ok: false as const,
                fieldErrors: {},
                formError: "O desconto geral não pode ser maior que o subtotal dos itens.",
            };
        }
    }

    // Os obrigatórios entram sempre (não dependem do que o navegador mandou).
    const bonuses = bonusCatalog.filter(
        (b) => isRequiredBonus(b.id) || result.data.bonuses.includes(b.id),
    );

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
                    email,
                    phoneNumber: phone,
                    type,
                    logoUrl,
                }).returning({ insertedId: clients.id })

                clientId = queryResult[0].insertedId;
            }

            const proposalTemplate = await tx.query.proposalTemplate.findFirst();

            if (!proposalTemplate) {
                throw new Error("O template não foi encontrado.")
            } 
            
            const content = proposalTemplate.content;

            const [proposal] = await tx.insert(proposals).values({
                publicToken,
                clientId,
                title: result.data.title,
                bonuses,
                deliveryDays: result.data.deliveryDays,
                discountType: result.data.discountType,
                discountValue: result.data.discountValue,
                hostingAnnual: result.data.hostingAnnual,
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
                    position: index,
                })),
            );
        })
    } catch (error) {
        if (error instanceof ClientNotFoundError) {
            return {
                ok: false as const,
                fieldErrors: {},
                formError: "Cliente não encontrado. Selecione outro cliente.",
            };
        }

        throw error;
    }

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
    const updated = await db
        .update(proposals)
        .set({ status: "sent", sentAt: new Date(), updatedAt: new Date() })
        .where(
            and(
                eq(proposals.id, result.data.id),
                eq(proposals.status, "draft"),
                isNull(proposals.deletedAt),
            ),
        )
        .returning({ id: proposals.id });

    if (updated.length === 0) {
        return {
            ok: false as const,
            formError: "Proposta não encontrada ou já enviada.",
        };
    }

    revalidatePath("/admin/propostas");

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

    revalidatePath("/admin/propostas");

    return { ok: true as const };
}
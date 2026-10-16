"use server"

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/db";
import { proposals } from "@/db/schema";
import { notifyProposalApproved } from "@/lib/push";
import { approveProposalSchema } from "@/lib/schemas/approve-proposal";

// Action PÚBLICA: o cliente não tem login. A proteção é o token (não adivinhável),
// o status "sent" e a validação Zod. Por isso NÃO chama requireUser().
export async function approveProposal(input: unknown) {
    const result = approveProposalSchema.safeParse(input);

    if (!result.success) {
        return { ok: false as const, formError: "Dados inválidos. Revise a forma de pagamento." };
    }

    const { token, paymentMethod } = result.data;
    const cardInstallments =
        result.data.paymentMethod === "card" ? result.data.cardInstallments : null;

    // Busca pelo token (nunca pelo ID), só aprova se estiver "sent", e grava tudo no
    // mesmo UPDATE. A condição no WHERE torna a checagem atômica: dois cliques
    // simultâneos não aprovam duas vezes.
    const updated = await db
        .update(proposals)
        .set({
            status: "approved",
            paymentMethod,
            cardInstallments,
            approvedAt: new Date(),
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(proposals.publicToken, token),
                eq(proposals.status, "sent"),
                isNull(proposals.deletedAt),
            ),
        )
        .returning({ id: proposals.id });

    if (updated.length === 0) {
        return {
            ok: false as const,
            formError: "Esta proposta não está disponível para aprovação.",
        };
    }

    revalidatePath("/propostas");

    // Avisa o dono no celular DEPOIS de responder ao cliente (after). A função nunca lança,
    // então uma falha no push não desfaz nem atrapalha a aprovação.
    after(() => notifyProposalApproved(updated[0].id));

    return { ok: true as const };
}

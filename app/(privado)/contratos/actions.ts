"use server";

import { and, eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as z from "zod";
import { db } from "@/db";
import { contractTemplates, contracts, proposals } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { buildContractFields, defaultContractBody, renderContract, unknownTemplateTokens } from "@/lib/contracts";
import {
    contractIdSchema,
    contractKindSchema,
    generateContractSchema,
    saveContractTemplateSchema,
} from "@/lib/schemas/contract";

// Toda action daqui segue a regra do projeto: requireUser() → Zod → banco.

// Gera o contrato de uma proposta: modelo do tipo + campos preenchidos = texto final, que fica CONGELADO
// na linha do contrato. O navegador manda só os campos; o modelo e a montagem do texto são do servidor.
export async function generateContract(input: unknown) {
    await requireUser();

    const result = generateContractSchema.safeParse(input);
    if (!result.success) {
        return { ok: false as const, fieldErrors: {}, formError: "Há campos inválidos. Confira os textos longos demais." };
    }

    const { proposalId, kind, inputs } = result.data;

    const built = buildContractFields(kind, inputs);
    if (!built.ok) {
        return { ok: false as const, fieldErrors: built.errors, formError: "Faltam dados para o contrato. Veja os campos marcados." };
    }

    // Contrato só de proposta enviada ou aprovada (rascunho ainda pode mudar tudo).
    const [proposal] = await db
        .select({ id: proposals.id })
        .from(proposals)
        .where(and(eq(proposals.id, proposalId), inArray(proposals.status, ["sent", "approved"]), isNull(proposals.deletedAt)));

    if (!proposal) {
        return { ok: false as const, fieldErrors: {}, formError: "Proposta não encontrada ou ainda em rascunho." };
    }

    const [template] = await db.select({ body: contractTemplates.body }).from(contractTemplates).where(eq(contractTemplates.kind, kind));
    const rendered = renderContract(template?.body ?? defaultContractBody[kind], built.fields, built.flags);

    if (rendered.missing.length > 0) {
        return {
            ok: false as const,
            fieldErrors: {},
            formError: `O modelo usa campos que este tipo de contrato não tem: ${rendered.missing.join(", ")}. Ajuste o modelo em Configurações.`,
        };
    }

    const [created] = await db
        .insert(contracts)
        .values({ proposalId, kind, body: rendered.text, inputs })
        .returning({ id: contracts.id });

    revalidatePath(`/propostas/${proposalId}`);
    revalidatePath(`/propostas/${proposalId}/contrato`);

    return { ok: true as const, id: created.id };
}

// Arquivar = soft delete. Serve para descartar um contrato gerado com dado errado antes de gerar outro.
export async function archiveContract(input: unknown) {
    await requireUser();

    const result = contractIdSchema.safeParse(input);
    if (!result.success) return { ok: false as const, formError: "Contrato inválido." };

    const [archived] = await db
        .update(contracts)
        .set({ deletedAt: new Date() })
        .where(and(eq(contracts.id, result.data.id), isNull(contracts.deletedAt)))
        .returning({ proposalId: contracts.proposalId });

    if (!archived) return { ok: false as const, formError: "Contrato não encontrado." };

    revalidatePath(`/propostas/${archived.proposalId}`);
    revalidatePath(`/propostas/${archived.proposalId}/contrato`);

    return { ok: true as const, proposalId: archived.proposalId };
}

// Salva o modelo de um tipo (upsert pela coluna única `kind`). Recusa marcação que o sistema não conhece,
// para o erro aparecer aqui e não na hora de gerar o contrato de um cliente.
export async function saveContractTemplate(input: unknown) {
    await requireUser();

    const result = saveContractTemplateSchema.safeParse(input);
    if (!result.success) {
        return { ok: false as const, formError: z.flattenError(result.error).fieldErrors.body?.[0] ?? "Modelo inválido." };
    }

    const { kind, body } = result.data;

    const unknown = unknownTemplateTokens(body);
    if (unknown.length > 0) {
        return { ok: false as const, formError: `Campos que o sistema não conhece: ${unknown.join(", ")}.` };
    }

    await db
        .insert(contractTemplates)
        .values({ kind, body })
        .onConflictDoUpdate({ target: contractTemplates.kind, set: { body, updatedAt: new Date() } });

    revalidatePath("/configuracoes/contratos");

    return { ok: true as const };
}

// Volta ao texto padrão: apaga a linha do modelo (sem linha, vale o texto do código).
export async function resetContractTemplate(input: unknown) {
    await requireUser();

    const result = contractKindSchema.safeParse(input);
    if (!result.success) return { ok: false as const, formError: "Modelo inválido." };

    await db.delete(contractTemplates).where(eq(contractTemplates.kind, result.data.kind));

    revalidatePath("/configuracoes/contratos");

    return { ok: true as const };
}

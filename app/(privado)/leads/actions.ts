"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { leadContacts, leads } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { isOpenStage } from "@/lib/leads";
import {
    leadContactSchema,
    leadDiagnosisSchema,
    leadIdSchema,
    leadSchema,
    updateLeadSchema,
} from "@/lib/schemas/lead";

// Toda action daqui segue a regra do projeto: requireUser() → Zod → banco.
// Retorno no mesmo formato das outras telas: { ok: true } ou { ok: false, fieldErrors, formError }.

function revalidateLeads(id?: string) {
    revalidatePath("/leads");
    revalidatePath("/hoje");
    if (id) revalidatePath(`/leads/${id}`);
}

export async function createLead(input: unknown) {
    await requireUser();

    const result = leadSchema.safeParse(input);
    if (!result.success) {
        return { ok: false as const, fieldErrors: z.flattenError(result.error).fieldErrors, formError: null };
    }

    const { phone, ...data } = result.data;

    const [row] = await db
        .insert(leads)
        .values({ ...data, phoneNumber: phone })
        .returning({ id: leads.id });

    revalidateLeads();

    return { ok: true as const, id: row.id };
}

export async function updateLead(input: unknown) {
    await requireUser();

    const result = updateLeadSchema.safeParse(input);
    if (!result.success) {
        return { ok: false as const, fieldErrors: z.flattenError(result.error).fieldErrors, formError: null };
    }

    const { id, phone, ...data } = result.data;

    const rows = await db
        .update(leads)
        .set({ ...data, phoneNumber: phone })
        .where(and(eq(leads.id, id), isNull(leads.deletedAt)))
        .returning({ id: leads.id });

    if (rows.length === 0) {
        return { ok: false as const, fieldErrors: {}, formError: "Lead não encontrado." };
    }

    revalidateLeads(id);

    return { ok: true as const };
}

// Registra um contato e, no MESMO passo (transação), atualiza estágio e próximo follow-up do lead.
// O follow-up enviado sempre substitui o anterior: depois de falar com o lead, o próximo passo é outro.
export async function logLeadContact(input: unknown) {
    await requireUser();

    const result = leadContactSchema.safeParse(input);
    if (!result.success) {
        return { ok: false as const, fieldErrors: z.flattenError(result.error).fieldErrors, formError: null };
    }

    const { leadId, channel, note, stage, lostReason, nextFollowUpAt } = result.data;

    const found = await db.transaction(async (tx) => {
        const [lead] = await tx
            .select({ stage: leads.stage })
            .from(leads)
            .where(and(eq(leads.id, leadId), isNull(leads.deletedAt)));

        if (!lead) return false;

        const finalStage = stage ?? lead.stage;

        await tx.insert(leadContacts).values({ leadId, channel, note });

        await tx
            .update(leads)
            .set({
                stage: finalStage,
                lostReason: finalStage === "lost" ? lostReason : null,
                nextFollowUpAt: isOpenStage(finalStage) ? nextFollowUpAt : null,
            })
            .where(eq(leads.id, leadId));

        return true;
    });

    if (!found) {
        return { ok: false as const, fieldErrors: {}, formError: "Lead não encontrado." };
    }

    revalidateLeads(leadId);

    return { ok: true as const };
}

export async function saveLeadDiagnosis(input: unknown) {
    await requireUser();

    const result = leadDiagnosisSchema.safeParse(input);
    if (!result.success) {
        return { ok: false as const, fieldErrors: z.flattenError(result.error).fieldErrors, formError: null };
    }

    const { leadId, answers } = result.data;

    const rows = await db
        .update(leads)
        // Tudo em branco = sem diagnóstico (null), para a tela saber que ainda não foi feito.
        .set({ diagnosis: Object.keys(answers).length > 0 ? answers : null })
        .where(and(eq(leads.id, leadId), isNull(leads.deletedAt)))
        .returning({ id: leads.id });

    if (rows.length === 0) {
        return { ok: false as const, fieldErrors: {}, formError: "Lead não encontrado." };
    }

    revalidateLeads(leadId);

    return { ok: true as const };
}

// Arquivar = soft delete (some das listas). Para "não deu certo", use o estágio Perdido:
// arquivar é para cadastro errado ou duplicado.
export async function archiveLead(input: unknown) {
    await requireUser();

    const result = leadIdSchema.safeParse(input);
    if (!result.success) {
        return { ok: false as const, error: "Lead inválido." };
    }

    const rows = await db
        .update(leads)
        .set({ deletedAt: new Date() })
        .where(and(eq(leads.id, result.data.id), isNull(leads.deletedAt)))
        .returning({ id: leads.id });

    if (rows.length === 0) {
        return { ok: false as const, error: "Lead não encontrado." };
    }

    revalidateLeads();

    return { ok: true as const };
}

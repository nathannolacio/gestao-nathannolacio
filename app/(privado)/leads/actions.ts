"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { leadContacts, leads, prospectingBatches } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { parseLeadImport } from "@/lib/lead-import";
import { isOpenStage } from "@/lib/leads";
import {
    leadContactSchema,
    leadDiagnosisSchema,
    leadIdSchema,
    leadImportSchema,
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

// ---------------------------------------------------------------------------
// Importação em lote. O navegador manda só o TEXTO colado; separar, validar e checar duplicados é
// tudo aqui no servidor (nunca confiar no que veio pronto do navegador). A mesma análise roda na
// conferência e de novo na importação, então o que é gravado é sempre o que acabou de ser validado.
// ---------------------------------------------------------------------------

type ImportRowStatus = "ok" | "duplicate" | "invalid";

async function analyzeImport(text: string) {
    const parsed = parseLeadImport(text);

    // Duplicado = mesmo WhatsApp, mesmo Instagram ou (sem nenhum dos dois) mesmo nome de negócio,
    // contra os leads ativos e contra as linhas anteriores do próprio lote.
    const existing = await db
        .select({ phone: leads.phoneNumber, instagram: leads.instagram, name: leads.businessName })
        .from(leads)
        .where(isNull(leads.deletedAt));

    const phones = new Set(existing.flatMap((l) => (l.phone ? [l.phone] : [])));
    const instagrams = new Set(existing.flatMap((l) => (l.instagram ? [l.instagram.toLowerCase()] : [])));
    const names = new Set(existing.map((l) => l.name.trim().toLowerCase()));

    const rows = parsed.rows.map(({ line, values }) => {
        const result = leadSchema.safeParse({
            businessName: values.negocio,
            contactName: values.contato,
            segment: values.segmento,
            city: values.cidade,
            phone: values.whatsapp,
            instagram: values.instagram,
            priority: values.nota?.toUpperCase(),
            previewUrl: values.previa_url,
            mapsUrl: values.maps_url,
            hook: values.gancho,
            source: "prospecting",
            stage: "new",
        });

        if (!result.success) {
            const message = result.error.issues.map((issue) => issue.message).join(" ");
            return { line, label: values.negocio ?? "(sem nome)", status: "invalid" as ImportRowStatus, message, data: null };
        }

        const data = result.data;
        const instagram = data.instagram?.toLowerCase() ?? null;
        const name = data.businessName.toLowerCase();
        const duplicate =
            (data.phone !== null && phones.has(data.phone)) ||
            (instagram !== null && instagrams.has(instagram)) ||
            (data.phone === null && instagram === null && names.has(name));

        // Registra a linha para pegar repetição dentro do próprio lote.
        if (data.phone) phones.add(data.phone);
        if (instagram) instagrams.add(instagram);
        names.add(name);

        return {
            line,
            label: data.businessName,
            status: (duplicate ? "duplicate" : "ok") as ImportRowStatus,
            message: duplicate ? "Já existe um lead com este WhatsApp, Instagram ou nome." : null,
            data: duplicate ? null : data,
        };
    });

    return { ...parsed, rows };
}

// Conferência: mostra o que vai entrar, sem gravar nada.
export async function previewLeadImport(input: unknown) {
    await requireUser();

    const result = leadImportSchema.safeParse(input);
    if (!result.success) {
        return { ok: false as const, formError: result.error.issues[0]?.message ?? "Texto inválido." };
    }

    const analysis = await analyzeImport(result.data.text);

    return {
        ok: true as const,
        unknownHeaders: analysis.unknownHeaders,
        tooMany: analysis.tooMany,
        rows: analysis.rows.map(({ line, label, status, message, data }) => ({
            line,
            label,
            status,
            message,
            priority: data?.priority ?? null,
            phone: data?.phone ?? null,
            instagram: data?.instagram ?? null,
            hasPreview: !!data?.previewUrl,
        })),
    };
}

// Importa as linhas válidas e não duplicadas num único INSERT (atômico: ou entram todas, ou nenhuma).
export async function importLeads(input: unknown) {
    await requireUser();

    const result = leadImportSchema.safeParse(input);
    if (!result.success) {
        return { ok: false as const, formError: result.error.issues[0]?.message ?? "Texto inválido." };
    }

    const analysis = await analyzeImport(result.data.text);
    const valid = analysis.rows.flatMap((row) => (row.data ? [row.data] : []));

    if (valid.length === 0) {
        return { ok: false as const, formError: "Nenhuma linha válida para importar." };
    }

    // Lote + leads na mesma transação: o lote só existe se os leads entrarem.
    const batch = result.data.batch;
    await db.transaction(async (tx) => {
        const batchId = batch
            ? (await tx.insert(prospectingBatches).values(batch).returning({ id: prospectingBatches.id }))[0].id
            : null;
        await tx.insert(leads).values(valid.map(({ phone, ...data }) => ({ ...data, phoneNumber: phone, batchId })));
    });

    revalidateLeads();

    return { ok: true as const, created: valid.length, skipped: analysis.rows.length - valid.length };
}

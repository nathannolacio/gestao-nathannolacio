"use server";

import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { leadContacts, leads, proposals, prospectingBatches } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { parseLeadImport } from "@/lib/lead-import";
import { isOpenStage, leadStageLabel } from "@/lib/leads";
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

        // Proposta enviada deste lead acompanha o lembrete (mesmo follow-up, visto da ficha da proposta).
        if (isOpenStage(finalStage)) {
            await tx
                .update(proposals)
                .set({ nextFollowUpAt })
                .where(and(eq(proposals.leadId, leadId), eq(proposals.status, "sent"), isNull(proposals.deletedAt)));
        }

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

// Arquivar = soft delete (`deletedAt`): sai das listas e do Hoje, mas fica na aba Arquivados para revisitar
// e continua bloqueando a importação do mesmo negócio. Perdido é para negociação que não deu certo;
// arquivar é para quem nem vale abordar agora (ou cadastro errado).
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

    revalidateLeads(result.data.id);

    return { ok: true as const };
}

// Restaurar = desfaz o arquivamento: o lead volta para as listas no estágio em que estava.
export async function restoreLead(input: unknown) {
    await requireUser();

    const result = leadIdSchema.safeParse(input);
    if (!result.success) {
        return { ok: false as const, error: "Lead inválido." };
    }

    const rows = await db
        .update(leads)
        .set({ deletedAt: null })
        .where(and(eq(leads.id, result.data.id), isNotNull(leads.deletedAt)))
        .returning({ id: leads.id });

    if (rows.length === 0) {
        return { ok: false as const, error: "Lead não encontrado." };
    }

    revalidateLeads(result.data.id);

    return { ok: true as const };
}

// ---------------------------------------------------------------------------
// Importação em lote. O navegador manda só o TEXTO colado; separar, validar e checar duplicados é
// tudo aqui no servidor (nunca confiar no que veio pronto do navegador). A mesma análise roda na
// conferência e de novo na importação, então o que é gravado é sempre o que acabou de ser validado.
// ---------------------------------------------------------------------------

type ImportRowStatus = "ok" | "duplicate" | "invalid";

// WhatsApp sem o 9 depois do DDD (55 + DDD + 9 + 8 dígitos → 55 + DDD + 8 dígitos), para o mesmo celular
// cadastrado com e sem o 9 contar como um só.
function phoneKey(digits: string) {
    return digits.length === 13 && digits[4] === "9" ? digits.slice(0, 4) + digits.slice(5) : digits;
}

// Texto para comparar: sem acento, minúsculo e com espaços simples.
function textKey(text: string) {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

async function analyzeImport(text: string) {
    const parsed = parseLeadImport(text);

    // Duplicado (contra TODOS os leads já cadastrados, inclusive ganhos, perdidos e arquivados, e contra as
    // linhas anteriores do próprio lote) quando bate qualquer um:
    // - mesmo WhatsApp, com ou sem o 9 depois do DDD;
    // - mesmo Instagram (sem diferenciar maiúsculas);
    // - mesmo nome (sem acento/maiúsculas) na mesma cidade, ou sem cidade em um dos dois.
    // Cada chave guarda QUEM ela é, para a conferência dizer o motivo.
    const existing = await db
        .select({
            phone: leads.phoneNumber,
            instagram: leads.instagram,
            name: leads.businessName,
            city: leads.city,
            stage: leads.stage,
            deletedAt: leads.deletedAt,
        })
        .from(leads);

    const phones = new Map<string, string>();
    const instagrams = new Map<string, string>();
    const names = new Map<string, { city: string | null; reason: string }[]>();

    function remember(
        lead: { phone: string | null; instagram: string | null; name: string; city: string | null },
        reason: string,
    ) {
        if (lead.phone && !phones.has(phoneKey(lead.phone))) phones.set(phoneKey(lead.phone), reason);
        if (lead.instagram && !instagrams.has(lead.instagram.toLowerCase())) {
            instagrams.set(lead.instagram.toLowerCase(), reason);
        }
        const key = textKey(lead.name);
        names.set(key, [...(names.get(key) ?? []), { city: lead.city ? textKey(lead.city) : null, reason }]);
    }

    for (const lead of existing) {
        remember(
            lead,
            lead.deletedAt
                ? `Já está nos Arquivados: ${lead.name}.`
                : `Já existe em ${leadStageLabel[lead.stage]}: ${lead.name}.`,
        );
    }

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
        const city = data.city ? textKey(data.city) : null;
        const duplicateOf =
            (data.phone !== null ? phones.get(phoneKey(data.phone)) : undefined) ??
            (data.instagram !== null ? instagrams.get(data.instagram.toLowerCase()) : undefined) ??
            names
                .get(textKey(data.businessName))
                ?.find((other) => other.city === null || city === null || other.city === city)?.reason;

        if (duplicateOf) {
            return { line, label: data.businessName, status: "duplicate" as ImportRowStatus, message: duplicateOf, data: null };
        }

        // Registra a linha que entra para pegar repetição dentro do próprio lote (sem sobrescrever o motivo de
        // quem já existe). Linha recusada não é registrada: ela não vai ser gravada.
        remember(
            { phone: data.phone, instagram: data.instagram, name: data.businessName, city: data.city },
            `Repetido nesta lista (linha ${line}).`,
        );

        // Fixo (12 dígitos) pode ter WhatsApp Business, mas muitas vezes não tem: entra, com aviso.
        const landline = data.phone !== null && data.phone.length === 12;

        return {
            line,
            label: data.businessName,
            status: "ok" as ImportRowStatus,
            message: landline ? "Número fixo: confira se tem WhatsApp antes de abordar." : null,
            data,
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

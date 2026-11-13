"use server";

import { and, desc, ilike, isNull, or } from "drizzle-orm";
import * as z from "zod";
import { db } from "@/db";
import { clients, leads, proposals } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { leadStageLabel } from "@/lib/leads";

export type SearchResult = {
    kind: "lead" | "client" | "proposal";
    id: string;
    title: string;
    subtitle: string | null;
    href: string;
};

const searchSchema = z.object({ query: z.string().trim().min(2).max(60) });

// Escapa os curingas do LIKE para o texto digitado valer literalmente.
function likePattern(text: string) {
    return `%${text.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

const LIMIT = 6;

// Busca global da barra do topo (⌘K): leads, clientes e propostas ativos.
// É um endpoint como qualquer action: exige login e valida o texto com Zod.
export async function searchEverything(input: unknown): Promise<SearchResult[]> {
    await requireUser();
    const parsed = searchSchema.safeParse(input);
    if (!parsed.success) return [];

    const pattern = likePattern(parsed.data.query);
    // Telefone: compara só os dígitos digitados (ex.: "9 8765" acha 5511987650000).
    const digits = parsed.data.query.replace(/\D/g, "");

    const [leadRows, clientRows, proposalRows] = await Promise.all([
        db
            .select({
                id: leads.id,
                businessName: leads.businessName,
                city: leads.city,
                stage: leads.stage,
                archived: leads.deletedAt,
            })
            .from(leads)
            .where(
                or(
                    ilike(leads.businessName, pattern),
                    ilike(leads.contactName, pattern),
                    ilike(leads.instagram, pattern),
                    digits.length >= 4 ? ilike(leads.phoneNumber, `%${digits}%`) : undefined,
                ),
            )
            .orderBy(desc(leads.updatedAt))
            .limit(LIMIT),
        db
            .select({ id: clients.id, name: clients.name, legalName: clients.legalName })
            .from(clients)
            .where(and(isNull(clients.deletedAt), or(ilike(clients.name, pattern), ilike(clients.legalName, pattern))))
            .limit(LIMIT),
        db
            .select({
                id: proposals.id,
                title: proposals.title,
                status: proposals.status,
                token: proposals.publicToken,
            })
            .from(proposals)
            .where(and(isNull(proposals.deletedAt), ilike(proposals.title, pattern)))
            .orderBy(desc(proposals.createdAt))
            .limit(LIMIT),
    ]);

    const proposalStatus = { draft: "Rascunho", sent: "Enviada", approved: "Aprovada" } as const;

    return [
        ...leadRows.map((lead) => ({
            kind: "lead" as const,
            id: lead.id,
            title: lead.businessName,
            subtitle: [lead.archived ? "Arquivado" : leadStageLabel[lead.stage], lead.city].filter(Boolean).join(" · "),
            href: `/leads/${lead.id}`,
        })),
        ...clientRows.map((client) => ({
            kind: "client" as const,
            id: client.id,
            title: client.name,
            subtitle: client.legalName,
            href: `/clientes/${client.id}/editar`,
        })),
        ...proposalRows.map((proposal) => ({
            kind: "proposal" as const,
            id: proposal.id,
            title: proposal.title,
            subtitle: proposalStatus[proposal.status],
            // Aprovada não se edita mais: abre a página que o cliente vê.
            href: proposal.status === "approved" ? `/proposta/${proposal.token}` : `/propostas/${proposal.id}/editar`,
        })),
    ];
}

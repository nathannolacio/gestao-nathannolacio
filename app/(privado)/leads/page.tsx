import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { db } from "@/db";
import {
    followUpLabel,
    leadSourceLabel,
    leadStageLabel,
    openLeadStages,
    priorityRank,
    todayInSaoPaulo,
    type LeadStage,
} from "@/lib/leads";
import { ArchiveLeadButton } from "./_components/archive-lead-button";
import { PriorityBadge } from "./_components/priority-badge";
import { StageBadge } from "./_components/stage-badge";

// Abas da lista (filtro pela URL: ?filtro=ganhos). Padrão = em aberto, agrupados por estágio.
// "Arquivados" não é estágio: são os leads com `deletedAt` (de qualquer estágio), numa lista só.
const filters = {
    abertos: { label: "Em aberto", stages: openLeadStages as readonly LeadStage[] },
    ganhos: { label: "Ganhos", stages: ["won"] as readonly LeadStage[] },
    perdidos: { label: "Perdidos", stages: ["lost"] as readonly LeadStage[] },
    arquivados: { label: "Arquivados", stages: [] as readonly LeadStage[] },
} as const;
type FilterKey = keyof typeof filters;

const shortDate = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" });

type LeadsProps = { searchParams: Promise<{ filtro?: string }> };

export default function Leads({ searchParams }: LeadsProps) {
    return (
        <>
            <div className="flex items-center justify-between gap-4">
                <h1 className="font-display text-2xl font-medium tracking-tight">Leads</h1>
                <div className="flex flex-wrap gap-2">
                    <Link
                        href="/leads/importar"
                        className="rounded-lg border border-admin-line px-4 py-2 text-sm text-admin-text transition-colors duration-150 hover:border-dourado"
                    >
                        Importar lista
                    </Link>
                    <Link
                        href="/leads/novo"
                        className="rounded-lg bg-dourado px-4 py-2 text-sm font-medium text-grafite transition-opacity duration-150 hover:opacity-90"
                    >
                        Novo lead
                    </Link>
                </div>
            </div>

            <Suspense fallback={<ListaSkeleton />}>
                <ListaLeads searchParams={searchParams} />
            </Suspense>
        </>
    );
}

async function ListaLeads({ searchParams }: LeadsProps) {
    await connection();
    const { filtro } = await searchParams;
    const active: FilterKey = filtro && filtro in filters ? (filtro as FilterKey) : "abertos";
    const today = todayInSaoPaulo();

    const everyLead = await db.query.leads.findMany({ orderBy: { createdAt: "desc" } });
    const all = everyLead.filter((lead) => lead.deletedAt === null);
    // Arquivado mais recente primeiro.
    const archived = everyLead
        .filter((lead) => lead.deletedAt !== null)
        .sort((a, b) => b.deletedAt!.getTime() - a.deletedAt!.getTime());

    const counts = Object.fromEntries(
        (Object.keys(filters) as FilterKey[]).map((key) => [
            key,
            key === "arquivados"
                ? archived.length
                : all.filter((lead) => filters[key].stages.includes(lead.stage)).length,
        ]),
    ) as Record<FilterKey, number>;

    const visible = all.filter((lead) => filters[active].stages.includes(lead.stage));

    // Dentro de cada estágio: nota A antes de B e C (sem nota no fim); depois, follow-up mais antigo primeiro.
    const byStage = filters[active].stages
        .map((stage) => ({
            stage,
            leads: visible
                .filter((lead) => lead.stage === stage)
                .sort(
                    (a, b) =>
                        priorityRank(a.priority) - priorityRank(b.priority) ||
                        (a.nextFollowUpAt ?? "9999").localeCompare(b.nextFollowUpAt ?? "9999"),
                ),
        }))
        .filter((group) => group.leads.length > 0);

    return (
        <>
            <nav aria-label="Filtro" className="mt-6 flex gap-1 border-b border-admin-line">
                {(Object.keys(filters) as FilterKey[]).map((key) => (
                    <Link
                        key={key}
                        href={key === "abertos" ? "/leads" : `/leads?filtro=${key}`}
                        aria-current={key === active ? "page" : undefined}
                        className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors duration-150 ${
                            key === active
                                ? "border-dourado text-admin-text"
                                : "border-transparent text-admin-muted hover:text-admin-text"
                        }`}
                    >
                        {filters[key].label}
                        <span className="ml-1.5 text-xs text-admin-muted">{counts[key]}</span>
                    </Link>
                ))}
            </nav>

            {active === "arquivados" ? (
                archived.length === 0 ? (
                    <div className="mt-6 rounded-xl border border-admin-line px-6 py-12 text-center">
                        <p className="text-admin-text">Nenhum lead arquivado.</p>
                        <p className="mt-1 text-sm text-admin-muted">
                            Arquive pela ficha do lead quem não vale abordar agora. Ele fica aqui para revisitar.
                        </p>
                    </div>
                ) : (
                    <ul className="mt-6 divide-y divide-admin-line overflow-hidden rounded-xl border border-admin-line">
                        {archived.map((lead) => (
                            <li key={lead.id}>
                                <Link
                                    href={`/leads/${lead.id}`}
                                    className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors duration-150 hover:bg-admin-raised/50"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="flex items-center gap-2 font-medium text-admin-text wrap-break-word">
                                            {lead.priority && <PriorityBadge priority={lead.priority} />}
                                            {lead.businessName}
                                        </p>
                                        <p className="mt-0.5 text-sm text-admin-muted wrap-break-word">
                                            {[lead.segment, lead.city, leadSourceLabel[lead.source]]
                                                .filter(Boolean)
                                                .join(" · ")}
                                        </p>
                                    </div>
                                    <StageBadge stage={lead.stage} />
                                    <span className="text-sm text-admin-muted">
                                        Arquivado em {shortDate.format(lead.deletedAt!)}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )
            ) : byStage.length === 0 ? (
                <div className="mt-6 rounded-xl border border-admin-line px-6 py-12 text-center">
                    <p className="text-admin-text">Nenhum lead aqui.</p>
                    {active === "abertos" && (
                        <p className="mt-1 text-sm text-admin-muted">
                            Cadastre os negócios da sua lista de prospecção em &quot;Novo lead&quot;.
                        </p>
                    )}
                </div>
            ) : (
                <div className="mt-6 space-y-8">
                    {byStage.map((group) => (
                        <section key={group.stage} aria-labelledby={`stage-${group.stage}`}>
                            <h2
                                id={`stage-${group.stage}`}
                                className="mb-2 text-xs font-medium tracking-wide text-admin-muted uppercase"
                            >
                                {leadStageLabel[group.stage]} · {group.leads.length}
                            </h2>
                            <ul className="divide-y divide-admin-line overflow-hidden rounded-xl border border-admin-line">
                                {group.leads.map((lead) => {
                                    const overdue = lead.nextFollowUpAt !== null && lead.nextFollowUpAt < today;
                                    return (
                                        <li key={lead.id} className="flex items-center pr-2 hover:bg-admin-raised/50">
                                            <Link
                                                href={`/leads/${lead.id}`}
                                                className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="flex items-center gap-2 font-medium text-admin-text wrap-break-word">
                                                        {lead.priority && <PriorityBadge priority={lead.priority} />}
                                                        {lead.businessName}
                                                    </p>
                                                    <p className="mt-0.5 text-sm text-admin-muted wrap-break-word">
                                                        {[lead.segment, lead.city, leadSourceLabel[lead.source]]
                                                            .filter(Boolean)
                                                            .join(" · ")}
                                                    </p>
                                                </div>
                                                {lead.stage === "lost" && lead.lostReason ? (
                                                    <span className="text-sm text-admin-muted">{lead.lostReason}</span>
                                                ) : lead.nextFollowUpAt ? (
                                                    <span
                                                        className={`text-sm ${overdue ? "text-red-300" : "text-admin-muted"}`}
                                                    >
                                                        {followUpLabel(lead.nextFollowUpAt, today)}
                                                    </span>
                                                ) : active === "abertos" ? (
                                                    <span className="text-sm text-dourado">Sem próximo passo</span>
                                                ) : (
                                                    <StageBadge stage={lead.stage} />
                                                )}
                                            </Link>
                                            <ArchiveLeadButton leadId={lead.id} archived={false} compact />
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    ))}
                </div>
            )}
        </>
    );
}

function ListaSkeleton() {
    return (
        <div aria-hidden="true" className="mt-6 divide-y divide-admin-line overflow-hidden rounded-xl border border-admin-line">
            {[0, 1, 2].map((linha) => (
                <div key={linha} className="flex items-center gap-4 px-4 py-4">
                    <div className="h-3 w-48 animate-pulse rounded bg-admin-raised" />
                    <div className="ml-auto h-3 w-20 animate-pulse rounded bg-admin-raised" />
                </div>
            ))}
        </div>
    );
}

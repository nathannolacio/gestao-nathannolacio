import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import { db } from "@/db";
import { journeySteps, nextActionLabel } from "@/lib/journey";
import { addDays, followUpLabel, priorityRank, todayInSaoPaulo, type LeadStage } from "@/lib/leads";
import { prospectingOffers, type ProspectingOffer } from "@/lib/prospecting-prompt";
import { PriorityBadge } from "../leads/_components/priority-badge";
import { PageHeader, buttonPrimary, buttonSecondary } from "../_components/page-header";

// Pipeline: a jornada comercial inteira num quadro, da prospecção ao fechamento.
// O lead muda de coluna pelos registros da ficha (contato, diagnóstico, proposta enviada/aprovada).
export default function Pipeline() {
    return (
        <>
            <PageHeader
                title="Pipeline"
                description="Da prospecção ao fechamento. Clique no card para ver a próxima ação."
                actions={
                    <>
                        <Link href="/leads/importar" className={buttonSecondary}>
                            Novo lote
                        </Link>
                        <Link href="/leads/novo" className={buttonPrimary}>
                            Novo lead
                        </Link>
                    </>
                }
            />

            <Suspense fallback={<BoardSkeleton />}>
                <Board />
            </Suspense>
        </>
    );
}

// Ganhos ficam no quadro por 30 dias (tempo de contrato e onboarding); depois, só na lista.
const WON_VISIBLE_DAYS = 30;
// Cards por coluna antes do "ver todos" (a coluna Abordar recebe lotes inteiros).
const COLUMN_LIMIT = 30;

const boardStages = ["new", "contacted", "talking", "diagnosis", "proposal", "won"] as const satisfies readonly LeadStage[];

async function Board() {
    await connection();
    const today = todayInSaoPaulo();
    // Início do dia em São Paulo (sem horário de verão desde 2019), igual ao painel Hoje.
    const wonSince = new Date(`${addDays(today, -WON_VISIBLE_DAYS)}T00:00:00-03:00`);

    const [leads, batches] = await Promise.all([
        db.query.leads.findMany({
            where: {
                deletedAt: { isNull: true },
                OR: [
                    { stage: { in: ["new", "contacted", "talking", "diagnosis", "proposal"] } },
                    { stage: "won", updatedAt: { gte: wonSince } },
                ],
            },
            columns: {
                id: true,
                businessName: true,
                segment: true,
                city: true,
                stage: true,
                priority: true,
                nextFollowUpAt: true,
                previewUrl: true,
            },
            orderBy: { createdAt: "asc" },
        }),
        db.query.prospectingBatches.findMany({
            with: { leads: { where: { deletedAt: { isNull: true } }, columns: { stage: true } } },
            orderBy: { createdAt: "desc" },
            limit: 6,
        }),
    ]);

    const byStage = new Map<LeadStage, typeof leads>(boardStages.map((stage) => [stage, []]));
    for (const lead of leads) byStage.get(lead.stage)?.push(lead);

    // Ordem dentro da coluna: follow-up vencido primeiro, depois nota A → C.
    for (const list of byStage.values()) {
        list.sort((a, b) => {
            const fa = a.nextFollowUpAt ?? "9999-12-31";
            const fb = b.nextFollowUpAt ?? "9999-12-31";
            return fa === fb ? priorityRank(a.priority) - priorityRank(b.priority) : fa < fb ? -1 : 1;
        });
    }

    return (
        <div className="-mx-4 mt-6 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8">
            <div className="flex min-w-max gap-3">
                <Column title={journeySteps[0].label} count={batches.length} hint="Lotes recentes">
                    {batches.length === 0 && <EmptyHint>Nenhum lote ainda. Peça uma lista ao Claude em Novo lote.</EmptyHint>}
                    {batches.map((batch) => {
                        const total = batch.leads.length;
                        const replied = batch.leads.filter((l) => !["new", "contacted", "lost"].includes(l.stage)).length;
                        const won = batch.leads.filter((l) => l.stage === "won").length;
                        return (
                            <div key={batch.id} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                                <p className="text-sm font-medium text-admin-text">{batch.niche}</p>
                                <p className="text-xs text-admin-muted">
                                    {batch.cities} · {prospectingOffers[batch.offer as ProspectingOffer]?.split(" (")[0] ?? batch.offer}
                                </p>
                                <dl className="mt-2 flex gap-3 text-xs text-admin-muted">
                                    <div>
                                        <dt className="sr-only">Leads</dt>
                                        <dd>{total} leads</dd>
                                    </div>
                                    <div>
                                        <dt className="sr-only">Responderam</dt>
                                        <dd>{total > 0 ? Math.round((replied / total) * 100) : 0}% responderam</dd>
                                    </div>
                                    {won > 0 && (
                                        <div>
                                            <dt className="sr-only">Ganhos</dt>
                                            <dd className="text-admin-success">{won} ganho{won > 1 ? "s" : ""}</dd>
                                        </div>
                                    )}
                                </dl>
                            </div>
                        );
                    })}
                </Column>

                {boardStages.map((stage) => {
                    const list = byStage.get(stage) ?? [];
                    const step = journeySteps.find((s) => s.id === stage)!;
                    return (
                        <Column key={stage} title={step.label} count={list.length} hint={nextActionLabel[stage]}>
                            {list.length === 0 && <EmptyHint>Nada aqui.</EmptyHint>}
                            {list.slice(0, COLUMN_LIMIT).map((lead) => {
                                const overdue = lead.nextFollowUpAt !== null && lead.nextFollowUpAt < today;
                                const dueToday = lead.nextFollowUpAt === today;
                                return (
                                    <Link
                                        key={lead.id}
                                        href={`/leads/${lead.id}`}
                                        className={`block rounded-xl border bg-white/[0.03] p-3 transition-colors duration-150 hover:border-dourado/70 ${
                                            overdue ? "border-red-400/40" : "border-admin-line"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="min-w-0 text-sm font-medium wrap-break-word text-admin-text">
                                                {lead.businessName}
                                            </p>
                                            {lead.priority && <PriorityBadge priority={lead.priority} />}
                                        </div>
                                        {(lead.segment || lead.city) && (
                                            <p className="mt-0.5 text-xs text-admin-muted">
                                                {[lead.segment, lead.city].filter(Boolean).join(" · ")}
                                            </p>
                                        )}
                                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                                            {lead.nextFollowUpAt && (
                                                <span className={overdue ? "text-red-300" : dueToday ? "text-dourado" : "text-admin-muted"}>
                                                    {followUpLabel(lead.nextFollowUpAt, today)}
                                                </span>
                                            )}
                                            {stage === "new" && lead.previewUrl && <span className="text-admin-success">Prévia pronta</span>}
                                        </div>
                                    </Link>
                                );
                            })}
                            {list.length > COLUMN_LIMIT && (
                                <Link href="/leads" className="block px-1 text-xs text-admin-muted hover:text-admin-text">
                                    + {list.length - COLUMN_LIMIT} na lista de leads
                                </Link>
                            )}
                        </Column>
                    );
                })}
            </div>
        </div>
    );
}

function Column({ title, count, hint, children }: { title: string; count: number; hint?: string; children: ReactNode }) {
    return (
        <section aria-label={title} className="admin-card flex w-64 shrink-0 flex-col">
            <header className="border-b border-admin-line px-3 py-2.5">
                <h2 className="flex items-center justify-between text-sm font-medium text-admin-text">
                    {title}
                    <span className="rounded-full bg-admin-raised px-2 py-0.5 text-xs text-admin-muted">{count}</span>
                </h2>
                {hint && <p className="mt-0.5 text-xs text-admin-muted">{hint}</p>}
            </header>
            <div className="flex max-h-[calc(100dvh-16rem)] flex-col gap-2 overflow-y-auto p-2">{children}</div>
        </section>
    );
}

function EmptyHint({ children }: { children: ReactNode }) {
    return <p className="px-1 py-2 text-xs text-admin-muted/80">{children}</p>;
}

function BoardSkeleton() {
    return (
        <div aria-hidden="true" className="mt-6 flex gap-3 overflow-hidden">
            {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-80 w-64 shrink-0 animate-pulse rounded-xl bg-admin-raised/50" />
            ))}
        </div>
    );
}

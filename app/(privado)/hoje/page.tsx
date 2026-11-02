import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import { db } from "@/db";
import { daysBetween, followUpLabel, openLeadStages, todayInSaoPaulo } from "@/lib/leads";
import { StageBadge } from "../leads/_components/stage-badge";

// Painel "Hoje": a tela inicial do sistema. Mostra só o que pede ação agora.
// Fases seguintes entram aqui (prazos de entrega, cortesias terminando, cobranças vencendo).
export default function Hoje() {
    return (
        <>
            <h1 className="font-display text-2xl font-medium tracking-tight">Hoje</h1>
            <Suspense fallback={<PainelSkeleton />}>
                <Painel />
            </Suspense>
        </>
    );
}

// Dias desde o envio de uma proposta para pedir o último follow-up (validade combinada: 7 dias).
const PROPOSAL_NUDGE_DAYS = 7;

async function Painel() {
    await connection();
    const today = todayInSaoPaulo();
    // São Paulo não tem horário de verão desde 2019: o dia começa às 00:00 −03:00.
    const startOfToday = new Date(`${today}T00:00:00-03:00`);

    const [due, withoutNextStep, waitingProposals, contactsToday] = await Promise.all([
        db.query.leads.findMany({
            where: {
                deletedAt: { isNull: true },
                stage: { in: [...openLeadStages] },
                nextFollowUpAt: { lte: today },
            },
            orderBy: { nextFollowUpAt: "asc" },
        }),
        db.query.leads.findMany({
            where: {
                deletedAt: { isNull: true },
                stage: { in: [...openLeadStages] },
                nextFollowUpAt: { isNull: true },
            },
            orderBy: { createdAt: "asc" },
        }),
        db.query.proposals.findMany({
            where: { deletedAt: { isNull: true }, status: "sent" },
            with: { client: true },
            orderBy: { sentAt: "asc" },
        }),
        db.query.leadContacts.findMany({
            where: { createdAt: { gte: startOfToday } },
            columns: { id: true },
        }),
    ]);

    return (
        <div className="mt-6 space-y-8">
            <dl className="grid grid-cols-3 gap-3">
                <Stat label="Contatos hoje" value={contactsToday.length} />
                <Stat label="Follow-ups pendentes" value={due.length} highlight={due.length > 0} />
                <Stat label="Propostas aguardando" value={waitingProposals.length} />
            </dl>

            <Section
                title="Follow-ups de hoje"
                empty="Nada para hoje. Bom momento para prospectar novos leads."
                action={{ href: "/leads/novo", label: "Novo lead" }}
            >
                {due.map((lead) => {
                    const overdue = lead.nextFollowUpAt! < today;
                    return (
                        <Row key={lead.id} href={`/leads/${lead.id}`} title={lead.businessName} subtitle={lead.segment}>
                            <StageBadge stage={lead.stage} />
                            <span className={`text-sm ${overdue ? "text-red-300" : "text-dourado"}`}>
                                {followUpLabel(lead.nextFollowUpAt!, today)}
                            </span>
                        </Row>
                    );
                })}
            </Section>

            <Section title="Propostas aguardando resposta" empty="Nenhuma proposta enviada esperando resposta.">
                {waitingProposals.map((proposal) => {
                    const days = proposal.sentAt ? daysBetween(todayInSaoPaulo(proposal.sentAt), today) : null;
                    const late = days !== null && days >= PROPOSAL_NUDGE_DAYS;
                    return (
                        <Row
                            key={proposal.id}
                            href={`/propostas/${proposal.id}/editar`}
                            title={proposal.client?.name ?? proposal.title}
                            subtitle={proposal.title}
                        >
                            <span className={`text-sm ${late ? "text-red-300" : "text-admin-muted"}`}>
                                {days === null
                                    ? "Enviada"
                                    : days === 0
                                      ? "Enviada hoje"
                                      : `Enviada há ${days} ${days === 1 ? "dia" : "dias"}`}
                                {late && " · último follow-up"}
                            </span>
                        </Row>
                    );
                })}
            </Section>

            {withoutNextStep.length > 0 && (
                <Section title="Leads sem próximo passo" empty="">
                    {withoutNextStep.map((lead) => (
                        <Row key={lead.id} href={`/leads/${lead.id}`} title={lead.businessName} subtitle={lead.segment}>
                            <StageBadge stage={lead.stage} />
                            <span className="text-sm text-dourado">Marcar follow-up</span>
                        </Row>
                    ))}
                </Section>
            )}
        </div>
    );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
    return (
        <div className="rounded-xl border border-admin-line px-3 py-3 sm:px-4">
            <dt className="text-xs text-admin-muted">{label}</dt>
            <dd className={`mt-1 font-display text-2xl ${highlight ? "text-dourado" : "text-admin-text"}`}>{value}</dd>
        </div>
    );
}

function Section({
    title,
    empty,
    action,
    children,
}: {
    title: string;
    empty: string;
    action?: { href: string; label: string };
    children: ReactNode[];
}) {
    return (
        <section aria-label={title}>
            <div className="mb-2 flex items-center justify-between gap-4">
                <h2 className="text-xs font-medium tracking-wide text-admin-muted uppercase">{title}</h2>
                {action && (
                    <Link href={action.href} className="text-sm text-dourado hover:underline">
                        {action.label}
                    </Link>
                )}
            </div>
            {children.length === 0 ? (
                <p className="rounded-xl border border-admin-line px-4 py-6 text-sm text-admin-muted">{empty}</p>
            ) : (
                <ul className="divide-y divide-admin-line overflow-hidden rounded-xl border border-admin-line">
                    {children}
                </ul>
            )}
        </section>
    );
}

function Row({
    href,
    title,
    subtitle,
    children,
}: {
    href: string;
    title: string;
    subtitle?: string | null;
    children: ReactNode;
}) {
    return (
        <li>
            <Link
                href={href}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors duration-150 hover:bg-admin-raised/50"
            >
                <div className="min-w-0 flex-1">
                    <p className="font-medium text-admin-text wrap-break-word">{title}</p>
                    {subtitle && <p className="mt-0.5 text-sm text-admin-muted wrap-break-word">{subtitle}</p>}
                </div>
                {children}
            </Link>
        </li>
    );
}

function PainelSkeleton() {
    return (
        <div aria-hidden="true" className="mt-6 space-y-8">
            <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl bg-admin-raised/50" />
                ))}
            </div>
            <div className="h-40 animate-pulse rounded-xl bg-admin-raised/50" />
        </div>
    );
}

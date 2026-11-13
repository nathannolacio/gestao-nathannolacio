import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import { db } from "@/db";
import { count, gte, and, inArray, isNull } from "drizzle-orm";
import { leads } from "@/db/schema";
import { getOptionalUser } from "@/lib/auth";
import {
    addDays,
    daysBetween,
    followUpLabel,
    formatShortDate,
    leadStageLabel,
    openLeadStages,
    priorityRank,
    todayInSaoPaulo,
} from "@/lib/leads";
import { ChatIcon, ClockIcon, ProposalsIcon, SparkIcon } from "../_components/icons";
import { PageHeader, StatTile, buttonSecondary } from "../_components/page-header";
import { ActivityChart, type ActivityPoint } from "./_components/activity-chart";
import { PriorityBadge } from "../leads/_components/priority-badge";
import { StageBadge } from "../leads/_components/stage-badge";

// Painel "Hoje": a tela inicial do sistema. Mostra só o que pede ação agora.
// Fases seguintes entram aqui (prazos de entrega, cortesias terminando, cobranças vencendo).
export default function Hoje() {
    return (
        <>
            <PageHeader
                title={
                    <Suspense fallback="Hoje">
                        <Greeting />
                    </Suspense>
                }
                description={
                    <Suspense fallback="O que pede ação agora.">
                        <TodayDate />
                    </Suspense>
                }
                actions={
                    <>
                        <Link href="/pipeline" className={buttonSecondary}>
                            Ver pipeline
                        </Link>
                        <Link href="/leads/importar" className={buttonSecondary}>
                            Importar lista
                        </Link>
                    </>
                }
            />
            <Suspense fallback={<PainelSkeleton />}>
                <Painel />
            </Suspense>
        </>
    );
}

// Hora atual em São Paulo (0 a 23), para a saudação.
function hourInSaoPaulo(now = new Date()) {
    return Number(
        new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hourCycle: "h23", timeZone: "America/Sao_Paulo" }).format(
            now,
        ),
    );
}

async function Greeting() {
    await connection();
    const user = await getOptionalUser();
    const hour = hourInSaoPaulo();
    const hello = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
    const firstName = user?.name.split(" ")[0];
    if (!firstName) return <>{hello}</>;
    return (
        <>
            {hello},{" "}
            <span className="bg-gradient-to-r from-[#f0d9ac] via-[#d4b37a] to-dourado bg-clip-text text-transparent">
                {firstName}
            </span>
        </>
    );
}

async function TodayDate() {
    await connection();
    const text = new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "America/Sao_Paulo",
    }).format(new Date(`${todayInSaoPaulo()}T12:00:00-03:00`));
    return <>{text.charAt(0).toUpperCase() + text.slice(1)} · o que pede ação agora.</>;
}

// Dias lidos para o gráfico de atividade (o gráfico deixa escolher 7, 14 ou 30).
const ACTIVITY_DAYS = 30;

// Dias desde o envio de uma proposta para pedir o último follow-up (validade combinada: 7 dias).
const PROPOSAL_NUDGE_DAYS = 7;

// Quantos leads novos a fila de abordagem mostra por vez (meta da rotina: ~15 por bloco).
const APPROACH_QUEUE_SIZE = 15;

async function Painel() {
    await connection();
    const today = todayInSaoPaulo();
    // São Paulo não tem horário de verão desde 2019: o dia começa às 00:00 −03:00.

    const activityStart = addDays(today, -(ACTIVITY_DAYS - 1));

    const [due, withoutNextStep, waitingProposals, recentContacts, funnel] = await Promise.all([
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
            where: { createdAt: { gte: new Date(`${activityStart}T00:00:00-03:00`) } },
            columns: { createdAt: true },
        }),
        // Leads em aberto por etapa (para o funil).
        db
            .select({ stage: leads.stage, value: count() })
            .from(leads)
            .where(and(isNull(leads.deletedAt), inArray(leads.stage, [...openLeadStages])))
            .groupBy(leads.stage),
    ]);

    // Contatos por dia (no fuso de São Paulo), com zero nos dias sem registro.
    const perDay = new Map<string, number>();
    for (const contact of recentContacts) {
        const day = todayInSaoPaulo(contact.createdAt);
        perDay.set(day, (perDay.get(day) ?? 0) + 1);
    }
    const activity: ActivityPoint[] = Array.from({ length: ACTIVITY_DAYS }, (_, index) => {
        const date = addDays(activityStart, index);
        return { date, label: formatShortDate(date), count: perDay.get(date) ?? 0 };
    });
    const contactsToday = perDay.get(today) ?? 0;
    const contactsWeek = activity.slice(-7).reduce((sum, point) => sum + point.count, 0);

    const funnelCounts = openLeadStages.map((stage) => ({
        stage,
        value: funnel.find((row) => row.stage === stage)?.value ?? 0,
    }));
    const funnelMax = Math.max(1, ...funnelCounts.map((row) => row.value));
    const openTotal = funnelCounts.reduce((sum, row) => sum + row.value, 0);

    // Leads novos ainda sem abordagem viram a fila do dia (A primeiro); os demais sem data pedem um próximo passo.
    const newLeads = withoutNextStep
        .filter((lead) => lead.stage === "new")
        .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
    const toApproach = newLeads.slice(0, APPROACH_QUEUE_SIZE);
    const stalled = withoutNextStep.filter((lead) => lead.stage !== "new");

    const overdueCount = due.filter((lead) => lead.nextFollowUpAt! < today).length;

    return (
        <div className="mt-6 space-y-4 lg:space-y-6">
            <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                <StatTile
                    featured
                    icon={<ClockIcon className="size-5" />}
                    tone={overdueCount > 0 ? "red" : "gold"}
                    label="Follow-ups"
                    value={due.length}
                    alert={overdueCount > 0}
                    hint={
                        overdueCount > 0 ? (
                            <>
                                <span className="text-rose-300">
                                    {overdueCount} atrasado{overdueCount === 1 ? "" : "s"}
                                </span>{" "}
                                · {due.length - overdueCount} para hoje
                            </>
                        ) : (
                            "para hoje"
                        )
                    }
                />
                <StatTile
                    icon={<SparkIcon className="size-5" />}
                    tone="gold"
                    label="Para abordar"
                    value={newLeads.length}
                    hint={`${newLeads.filter((lead) => lead.priority === "A").length} com nota A`}
                />
                <StatTile
                    icon={<ProposalsIcon className="size-5" />}
                    tone="blue"
                    label="Propostas"
                    value={waitingProposals.length}
                    hint="aguardando resposta"
                    href="/propostas"
                />
                <StatTile
                    icon={<ChatIcon className="size-5" />}
                    tone="green"
                    label="Contatos hoje"
                    value={contactsToday}
                    hint={`${contactsWeek} nos últimos 7 dias`}
                />
            </dl>

            <div className="grid gap-4 lg:grid-cols-5">
                <section aria-label="Atividade" className="admin-card p-5 lg:col-span-3">
                    <ActivityChart points={activity} />
                </section>

                <section aria-labelledby="funil" className="admin-card flex flex-col p-5 lg:col-span-2">
                    <div className="mb-4 flex items-baseline justify-between gap-4">
                        <h2 id="funil" className="font-medium text-admin-text">
                            Funil em aberto
                        </h2>
                        <Link href="/pipeline" className="text-sm text-admin-muted hover:text-dourado">
                            <span className="font-medium text-admin-text tabular-nums">{openTotal}</span> leads →
                        </Link>
                    </div>
                    <ul className="flex flex-1 flex-col justify-around gap-3">
                        {funnelCounts.map((row) => (
                            <li key={row.stage}>
                                <div className="mb-1 flex justify-between text-sm">
                                    <span className="text-admin-muted">{leadStageLabel[row.stage]}</span>
                                    <span className="font-medium text-admin-text tabular-nums">{row.value}</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-white/[0.06]">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-bronze to-[#e0c088]"
                                        style={{ width: `${(row.value / funnelMax) * 100}%` }}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>

            <div className="grid gap-4 lg:gap-6 xl:grid-cols-2">
                <div className="space-y-4 lg:space-y-6">
                    <Section
                        title="Follow-ups de hoje"
                        empty="Nada para hoje. Bom momento para prospectar novos leads."
                        action={{ href: "/leads/novo", label: "Novo lead" }}
                    >
                        {due.map((lead) => {
                            const overdue = lead.nextFollowUpAt! < today;
                            return (
                                <Row
                                    key={lead.id}
                                    href={`/leads/${lead.id}`}
                                    title={lead.businessName}
                                    subtitle={lead.segment}
                                >
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

                    {stalled.length > 0 && (
                        <Section title="Leads sem próximo passo" empty="">
                            {stalled.map((lead) => (
                                <Row
                                    key={lead.id}
                                    href={`/leads/${lead.id}`}
                                    title={lead.businessName}
                                    subtitle={lead.segment}
                                >
                                    <StageBadge stage={lead.stage} />
                                    <span className="text-sm text-dourado">Marcar follow-up</span>
                                </Row>
                            ))}
                        </Section>
                    )}
                </div>

                <Section
                    title={newLeads.length > 0 ? `Para abordar · ${newLeads.length}` : "Para abordar"}
                    empty="Nenhum lead novo na fila. Importe uma lista de prospecção."
                    action={{ href: "/leads/importar", label: "Importar lista" }}
                >
                    {toApproach.map((lead) => (
                        <Row
                            key={lead.id}
                            href={`/leads/${lead.id}`}
                            title={lead.businessName}
                            subtitle={[lead.segment, lead.city].filter(Boolean).join(" · ") || null}
                        >
                            {lead.priority && <PriorityBadge priority={lead.priority} />}
                            <span className="text-sm text-dourado">
                                {lead.phoneNumber ? "Mandar mensagem" : "Abordar no Instagram"}
                            </span>
                        </Row>
                    ))}
                </Section>
            </div>
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
            <div className="mb-3 flex items-center justify-between gap-4">
                <h2 className="font-medium text-admin-text">{title}</h2>
                {action && (
                    <Link href={action.href} className="text-sm text-admin-muted transition-colors hover:text-dourado">
                        {action.label}
                    </Link>
                )}
            </div>
            {children.length === 0 ? (
                <p className="rounded-xl border border-dashed border-admin-line px-4 py-6 text-sm text-admin-muted">
                    {empty}
                </p>
            ) : (
                <ul className="admin-card divide-y divide-white/[0.05] overflow-hidden">{children}</ul>
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
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 transition-colors duration-150 hover:bg-white/[0.03]"
            >
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-admin-text wrap-break-word">{title}</p>
                    {subtitle && <p className="text-xs text-admin-muted wrap-break-word">{subtitle}</p>}
                </div>
                {children}
            </Link>
        </li>
    );
}

function PainelSkeleton() {
    return (
        <div aria-hidden="true" className="mt-6 space-y-4 lg:space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-40 animate-pulse rounded-2xl bg-white/[0.04]" />
                ))}
            </div>
            <div className="h-64 animate-pulse rounded-2xl bg-white/[0.04]" />
        </div>
    );
}

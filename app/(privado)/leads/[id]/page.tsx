import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import * as z from "zod";
import { db } from "@/db";
import {
    contactChannelLabel,
    diagnosisQuestions,
    followUpLabel,
    leadSourceLabel,
    suggestOffer,
    todayInSaoPaulo,
    whatsappUrl,
} from "@/lib/leads";
import { ArchiveLeadButton } from "../_components/archive-lead-button";
import { ContactForm } from "../_components/contact-form";
import { DiagnosisForm } from "../_components/diagnosis-form";
import { FirstMessage } from "../_components/first-message";
import { LeadForm } from "../_components/lead-form";
import { PriorityBadge } from "../_components/priority-badge";
import { StageBadge } from "../_components/stage-badge";
import { StatusBadge } from "../../propostas/_components/status-badge";
import { JourneyPanel, type JourneyAction } from "../_components/journey-panel";
import { contractPrompt, followUpPrompt, previewPrompt, proposalPrompt, SITE_URL } from "@/lib/claude-prompts";
import { journeyChecklist, type JourneyFacts } from "@/lib/journey";
import { leadStageLabel } from "@/lib/leads";

type LeadPageProps = { params: Promise<{ id: string }> };

const dateTime = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
});

// A página só repassa a promessa; o `await` fica dentro do Suspense (cacheComponents).
export default function LeadPage({ params }: LeadPageProps) {
    return (
        <>
            <Link href="/leads" className="text-sm text-admin-muted hover:text-admin-text">
                ← Leads
            </Link>
            <Suspense fallback={<div className="mt-4 h-40 animate-pulse rounded-xl bg-admin-raised/50" />}>
                <FichaDoLead params={params} />
            </Suspense>
        </>
    );
}

async function FichaDoLead({ params }: LeadPageProps) {
    await connection();
    const { id } = await params;

    // O id vem da URL: valida antes de consultar (um texto qualquer quebraria o cast para uuid).
    if (!z.uuid().safeParse(id).success) notFound();

    // Arquivado também abre (para revisitar e restaurar), mas só leitura: as actions de edição recusam arquivado.
    const lead = await db.query.leads.findFirst({
        where: { id },
        with: {
            contacts: { orderBy: { createdAt: "desc" } },
            proposals: {
                where: { deletedAt: { isNull: true } },
                columns: { id: true, title: true, status: true, publicToken: true },
                orderBy: { createdAt: "desc" },
            },
            client: {
                columns: {
                    id: true,
                    legalName: true,
                    document: true,
                    email: true,
                    zipCode: true,
                    street: true,
                    addressNumber: true,
                    addressComplement: true,
                    neighborhood: true,
                    city: true,
                    state: true,
                },
            },
        },
    });

    if (!lead) notFound();

    const today = todayInSaoPaulo();
    const overdue = lead.nextFollowUpAt !== null && lead.nextFollowUpAt < today;
    const archived = lead.deletedAt !== null;
    const answered = diagnosisQuestions.filter((q) => lead.diagnosis?.[q.id]).length;

    // Jornada: checklist calculado dos dados + ações da etapa (Claude, WhatsApp, telas do sistema).
    const client = lead.client;
    const facts: JourneyFacts = {
        priority: lead.priority,
        hasPhone: Boolean(lead.phoneNumber),
        hasInstagram: Boolean(lead.instagram),
        hasPreview: Boolean(lead.previewUrl),
        contacts: lead.contacts.length,
        hasFollowUp: lead.nextFollowUpAt !== null,
        diagnosis: lead.diagnosis,
        proposalStatuses: lead.proposals.map((p) => p.status),
        contractDataReady: client
            ? Boolean(
                  client.legalName &&
                      client.document &&
                      client.zipCode &&
                      client.street &&
                      client.addressNumber &&
                      client.city &&
                      client.state,
              )
            : null,
    };
    const recentContacts = lead.contacts.slice(0, 5).map((c) => ({
        date: dateTime.format(c.createdAt),
        channel: contactChannelLabel[c.channel],
        note: c.note,
    }));
    const approvedProposal = lead.proposals.find((p) => p.status === "approved");
    const activeProposal = approvedProposal ?? lead.proposals.find((p) => p.status === "sent");
    const whatsappAction: JourneyAction[] = lead.phoneNumber
        ? [{ kind: "external", label: "Abrir WhatsApp", href: whatsappUrl(lead.phoneNumber) }]
        : [];
    const followUpAction: JourneyAction = {
        kind: "claude",
        label: "Escrever follow-up com o Claude",
        prompt: followUpPrompt(lead, leadStageLabel[lead.stage], recentContacts),
    };

    const actions: JourneyAction[] = (() => {
        switch (lead.stage) {
            case "new":
                return [
                    ...(!lead.previewUrl && lead.priority !== "C"
                        ? [{ kind: "claude", label: "Gerar prévia no Claude", prompt: previewPrompt(lead) } as const]
                        : []),
                    ...(lead.mapsUrl ? [{ kind: "external", label: "Ver no Google Maps", href: lead.mapsUrl } as const] : []),
                ];
            case "contacted":
            case "talking":
                return [followUpAction, ...whatsappAction];
            case "diagnosis":
                return [
                    { kind: "claude", label: "Montar proposta com o Claude", prompt: proposalPrompt(lead, lead.diagnosis) },
                    { kind: "internal", label: "Criar proposta", href: `/propostas/nova?lead=${lead.id}`, primary: true },
                ];
            case "proposal":
                return [
                    followUpAction,
                    ...(activeProposal
                        ? [{ kind: "external", label: "Ver página da proposta", href: `/proposta/${activeProposal.publicToken}` } as const]
                        : []),
                    ...whatsappAction,
                ];
            case "won":
                return [
                    ...(client
                        ? [{ kind: "internal", label: "Completar dados do contrato", href: `/clientes/${client.id}/editar`, primary: !facts.contractDataReady } as const]
                        : []),
                    {
                        kind: "claude",
                        label: "Gerar contrato com o Claude",
                        prompt: contractPrompt(
                            lead,
                            client ?? null,
                            approvedProposal
                                ? { title: approvedProposal.title, publicUrl: `${SITE_URL}/proposta/${approvedProposal.publicToken}` }
                                : null,
                        ),
                    },
                ];
            case "lost":
                return [];
        }
    })();

    return (
        <>
            <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="font-display text-2xl font-medium tracking-tight wrap-break-word">
                        {lead.businessName}
                    </h1>
                    <p className="mt-1 text-sm text-admin-muted">
                        {[
                            lead.contactName,
                            lead.segment,
                            lead.city,
                            leadSourceLabel[lead.source] + (lead.referredBy ? ` (${lead.referredBy})` : ""),
                        ]
                            .filter(Boolean)
                            .join(" · ")}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <StageBadge stage={lead.stage} />
                        {lead.priority && <PriorityBadge priority={lead.priority} />}
                        {lead.nextFollowUpAt && (
                            <span className={`text-sm ${overdue ? "text-red-300" : "text-admin-muted"}`}>
                                Follow-up: {followUpLabel(lead.nextFollowUpAt, today)}
                            </span>
                        )}
                        {lead.stage === "lost" && lead.lostReason && (
                            <span className="text-sm text-admin-muted">Motivo: {lead.lostReason}</span>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {lead.phoneNumber && (
                        <a
                            href={whatsappUrl(lead.phoneNumber)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg border border-admin-line px-3 py-2 text-sm text-admin-text transition-colors duration-150 hover:border-dourado"
                        >
                            Abrir WhatsApp
                        </a>
                    )}
                    {lead.previewUrl && (
                        <ExternalButton href={lead.previewUrl}>Prévia</ExternalButton>
                    )}
                    {lead.mapsUrl && <ExternalButton href={lead.mapsUrl}>Google Maps</ExternalButton>}
                    {lead.instagram && (
                        <a
                            href={`https://instagram.com/${lead.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg border border-admin-line px-3 py-2 text-sm text-admin-text transition-colors duration-150 hover:border-dourado"
                        >
                            @{lead.instagram}
                        </a>
                    )}
                    {!archived && (lead.stage === "diagnosis" || lead.stage === "proposal") && (
                        <Link
                            href={`/propostas/nova?lead=${lead.id}`}
                            className="rounded-lg bg-dourado px-3 py-2 text-sm font-medium text-grafite transition-opacity duration-150 hover:opacity-90"
                        >
                            Criar proposta
                        </Link>
                    )}
                    {!archived && <ArchiveLeadButton leadId={lead.id} archived={false} />}
                </div>
            </div>

            {archived ? (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dourado/40 px-4 py-3">
                    <p className="text-sm text-admin-text">
                        Arquivado em {dateTime.format(lead.deletedAt!)}. Para abordar ou editar, restaure o lead.
                    </p>
                    <ArchiveLeadButton leadId={lead.id} archived />
                </div>
            ) : (
                <div className="mt-6">
                    <JourneyPanel stage={lead.stage} checklist={journeyChecklist(lead.stage, facts)} actions={actions} />
                </div>
            )}

            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                {archived ? (
                    <Card title="Dados do lead">
                        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                            {[
                                ["WhatsApp", lead.phoneNumber],
                                ["Instagram", lead.instagram && `@${lead.instagram}`],
                                ["Gancho", lead.hook],
                                ["Prévia", lead.previewUrl],
                                ["Google Maps", lead.mapsUrl],
                            ]
                                .filter(([, value]) => value)
                                .map(([label, value]) => (
                                    <div key={label} className="min-w-0">
                                        <dt className="text-admin-muted">{label}</dt>
                                        <dd className="text-admin-text wrap-break-word">{value}</dd>
                                    </div>
                                ))}
                        </dl>
                    </Card>
                ) : (
                    <div className="space-y-8">
                        {lead.stage === "new" && lead.phoneNumber && (
                            <Card title={lead.previewUrl ? "Primeira mensagem (com prévia)" : "Primeira mensagem"}>
                                <FirstMessage
                                    // Remonta (refaz o texto) quando os dados salvos do lead mudam.
                                    key={[lead.businessName, lead.contactName, lead.hook, lead.previewUrl, lead.segment].join("|")}
                                    phone={lead.phoneNumber}
                                    lead={{
                                        businessName: lead.businessName,
                                        contactName: lead.contactName,
                                        hook: lead.hook,
                                        previewUrl: lead.previewUrl,
                                    }}
                                    initialOffer={suggestOffer(lead.segment)}
                                />
                            </Card>
                        )}

                        {lead.proposals.length > 0 && (
                            <Card title={`Propostas · ${lead.proposals.length}`}>
                                <ul className="divide-y divide-admin-line">
                                    {lead.proposals.map((proposal) => (
                                        <li key={proposal.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
                                            <Link
                                                href={`/propostas/${proposal.id}`}
                                                className="min-w-0 text-sm text-admin-text hover:text-dourado"
                                            >
                                                {proposal.title}
                                            </Link>
                                            <span className="flex items-center gap-3">
                                                <StatusBadge status={proposal.status} />
                                                <ExternalButton href={`/proposta/${proposal.publicToken}`}>Ver página</ExternalButton>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        )}

                        <Card title="Registrar contato">
                            {/* key: recria o formulário quando o estágio muda, para a sugestão de estágio acompanhar. */}
                            <ContactForm
                                key={`${lead.stage}-${lead.contacts.length}`}
                                leadId={lead.id}
                                currentStage={lead.stage}
                                today={today}
                            />
                        </Card>

                        <Collapsible title="Diagnóstico" meta={`${answered} de ${diagnosisQuestions.length} respondidas`}>
                            <DiagnosisForm leadId={lead.id} initial={lead.diagnosis} />
                        </Collapsible>

                        <Collapsible title="Dados do lead">
                            <LeadForm
                                mode="edit"
                                leadId={lead.id}
                                initialValues={{
                                    businessName: lead.businessName,
                                    contactName: lead.contactName ?? "",
                                    segment: lead.segment ?? "",
                                    city: lead.city ?? "",
                                    phone: lead.phoneNumber ?? "",
                                    instagram: lead.instagram ?? "",
                                    source: lead.source,
                                    referredBy: lead.referredBy ?? "",
                                    stage: lead.stage,
                                    lostReason: lead.lostReason ?? "",
                                    nextFollowUpAt: lead.nextFollowUpAt ?? "",
                                    notes: lead.notes ?? "",
                                    priority: lead.priority ?? "",
                                    hook: lead.hook ?? "",
                                    previewUrl: lead.previewUrl ?? "",
                                    mapsUrl: lead.mapsUrl ?? "",
                                }}
                            />
                        </Collapsible>
                    </div>
                )}

                <Card title={`Histórico · ${lead.contacts.length}`}>
                    {lead.notes && (
                        <p className="mb-4 rounded-lg bg-admin-raised px-3 py-2 text-sm whitespace-pre-line text-admin-muted">
                            {lead.notes}
                        </p>
                    )}
                    {lead.contacts.length === 0 ? (
                        <p className="text-sm text-admin-muted">Nenhum contato registrado ainda.</p>
                    ) : (
                        <ol className="space-y-4">
                            {lead.contacts.map((contact) => (
                                <li key={contact.id} className="border-l-2 border-admin-line pl-3">
                                    <p className="text-xs text-admin-muted">
                                        {dateTime.format(contact.createdAt)} · {contactChannelLabel[contact.channel]}
                                    </p>
                                    {contact.note && (
                                        <p className="mt-0.5 text-sm whitespace-pre-line text-admin-text">
                                            {contact.note}
                                        </p>
                                    )}
                                </li>
                            ))}
                        </ol>
                    )}
                    <p className="mt-6 text-xs text-admin-muted">
                        Cadastrado em {dateTime.format(lead.createdAt)}
                    </p>
                </Card>
            </div>
        </>
    );
}

// Link externo digitado pelo dono (prévia, Maps): o Zod só aceita http(s), então não vira `javascript:`.
function ExternalButton({ href, children }: { href: string; children: ReactNode }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-admin-line px-3 py-2 text-sm text-admin-text transition-colors duration-150 hover:border-dourado"
        >
            {children}
        </a>
    );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="rounded-xl border border-admin-line p-4 sm:p-5">
            <h2 className="mb-4 font-display text-lg font-medium">{title}</h2>
            {children}
        </section>
    );
}

// <details> nativo: abre/fecha sem JavaScript.
function Collapsible({ title, meta, children }: { title: string; meta?: string; children: ReactNode }) {
    return (
        <details className="group rounded-xl border border-admin-line p-4 sm:p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="font-display text-lg font-medium">{title}</span>
                <span className="flex items-center gap-3 text-sm text-admin-muted">
                    {meta}
                    <span aria-hidden="true" className="transition-transform duration-150 group-open:rotate-180">
                        ▾
                    </span>
                </span>
            </summary>
            <div className="mt-4">{children}</div>
        </details>
    );
}

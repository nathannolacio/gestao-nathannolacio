import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import * as z from "zod";
import { db } from "@/db";
import { bonusDisplayValue } from "@/lib/proposal-bonuses";
import {
    formatBRL,
    installmentAmount,
    itemSubtotal,
    pixTotal,
    splitPayment,
    toDiscount,
    totalFromRows,
} from "@/lib/proposal-calc";
import {
    contactChannelLabel,
    daysBetween,
    followUpLabel,
    formatPhone,
    todayInSaoPaulo,
    whatsappUrl,
} from "@/lib/leads";
import { proposalFollowUpPrompt, SITE_URL } from "@/lib/claude-prompts";
import { PageHeader, buttonPrimary, buttonSecondary } from "../../_components/page-header";
import { ClaudeButton } from "../../leads/_components/claude-button";
import { FollowUpForm } from "../_components/follow-up-form";
import { ProposalActions } from "../_components/proposal-actions";
import { StatusBadge } from "../_components/status-badge";

type FichaPropostaProps = { params: Promise<{ id: string }> };

const dateTime = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
});

const dateOnly = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
});

// A partir de quantas tentativas sem resposta o painel sugere encerrar (mesma regra do prompt).
const ATTEMPTS_BEFORE_CLOSING = 3;

// A página só repassa a promessa; o `await` fica dentro do Suspense (cacheComponents).
export default function FichaProposta({ params }: FichaPropostaProps) {
    return (
        <Suspense fallback={<FichaSkeleton />}>
            <Ficha params={params} />
        </Suspense>
    );
}

async function Ficha({ params }: FichaPropostaProps) {
    await connection();
    const { id } = await params;

    // O id vem da URL: valida antes de consultar (um texto qualquer quebraria o cast para uuid).
    if (!z.uuid().safeParse(id).success) notFound();

    const proposal = await db.query.proposals.findFirst({
        where: { id, deletedAt: { isNull: true } },
        with: {
            client: true,
            items: { orderBy: { position: "asc" } },
            lead: { columns: { id: true, businessName: true, contactName: true } },
            contacts: { orderBy: { createdAt: "desc" } },
            views: { orderBy: { viewedAt: "asc" }, columns: { viewedAt: true } },
        },
    });

    if (!proposal || !proposal.client) notFound();

    const client = proposal.client;
    const today = todayInSaoPaulo();
    const total = totalFromRows(proposal);
    const publicPath = `/proposta/${proposal.publicToken}`;
    const firstView = proposal.views[0]?.viewedAt ?? null;
    const lastView = proposal.views.at(-1)?.viewedAt ?? null;
    const sentDays = proposal.sentAt ? daysBetween(todayInSaoPaulo(proposal.sentAt), today) : null;

    // Tentativas desde a última resposta do cliente (o histórico vem do mais recente para o mais antigo).
    const lastReplyIndex = proposal.contacts.findIndex((c) => c.clientReplied);
    const attemptsWithoutReply = lastReplyIndex === -1 ? proposal.contacts.length : lastReplyIndex;

    const viewsLabel =
        proposal.views.length === 0
            ? "ainda não abriu"
            : `${proposal.views.length} ${proposal.views.length === 1 ? "vez" : "vezes"}, a última em ${dateTime.format(lastView!)}`;

    const prompt = proposalFollowUpPrompt(
        {
            clientName: client.name,
            contactName: proposal.lead?.contactName ?? null,
            title: proposal.title,
            publicUrl: `${SITE_URL}${publicPath}`,
            total: formatBRL(total),
            sentLabel: proposal.sentAt ? `${dateOnly.format(proposal.sentAt)} (${daysLabel(sentDays!)})` : "(sem data)",
            viewsLabel,
            attemptsWithoutReply,
        },
        proposal.contacts.slice(0, 5).map((c) => ({
            date: dateTime.format(c.createdAt),
            channel: contactChannelLabel[c.channel] + (c.clientReplied ? " (cliente respondeu)" : ""),
            note: c.note,
        })),
    );

    return (
        <>
            <PageHeader
                back={{ href: "/propostas", label: "Propostas" }}
                title={proposal.title}
                description={
                    <>
                        <Link href={`/clientes/${client.id}`} className="hover:text-dourado">
                            {client.name}
                        </Link>
                        {" · "}
                        {formatBRL(total)}
                    </>
                }
                actions={
                    <>
                        {proposal.status !== "approved" && (
                            <Link href={`/propostas/${proposal.id}/editar`} className={buttonSecondary}>
                                Editar
                            </Link>
                        )}
                        <a href={publicPath} target="_blank" rel="noopener noreferrer" className={buttonPrimary}>
                            Ver página do cliente
                        </a>
                        <ProposalActions
                            id={proposal.id}
                            publicToken={proposal.publicToken}
                            status={proposal.status}
                            showDevRevert={process.env.NODE_ENV !== "production"}
                            hideEdit
                            archivedHref="/propostas"
                        />
                    </>
                }
            >
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <StatusBadge status={proposal.status} />
                    {proposal.status === "sent" && (
                        <span className={`text-sm ${firstView ? "text-admin-success" : "text-admin-muted"}`}>
                            {firstView ? "Visualizada" : "Ainda não visualizada"}
                        </span>
                    )}
                </div>
            </PageHeader>

            <Timeline
                steps={[
                    { label: "Criada", at: proposal.createdAt },
                    { label: "Enviada", at: proposal.sentAt },
                    {
                        label: "Visualizada",
                        at: firstView,
                        note: proposal.views.length > 1 ? `${proposal.views.length} visitas` : undefined,
                    },
                    { label: "Aprovada", at: proposal.approvedAt },
                ]}
            />

            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                <div className="space-y-8">
                    {proposal.status === "sent" && (
                        <section id="follow-up" className="admin-card scroll-mt-6 p-4 sm:p-5">
                            <h2 className="font-display text-lg font-medium">Follow-up</h2>

                            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
                                <Fact label="Enviada">{sentDays === null ? "—" : daysLabel(sentDays)}</Fact>
                                <Fact label="Visualizações">
                                    {proposal.views.length === 0
                                        ? "Nenhuma"
                                        : `${proposal.views.length} · última ${dateTime.format(lastView!)}`}
                                </Fact>
                                <Fact label="Sem resposta">
                                    <span className={attemptsWithoutReply >= ATTEMPTS_BEFORE_CLOSING ? "text-red-300" : undefined}>
                                        {attemptsWithoutReply} {attemptsWithoutReply === 1 ? "tentativa" : "tentativas"}
                                    </span>
                                </Fact>
                                <Fact label="Próximo lembrete">
                                    {proposal.nextFollowUpAt ? (
                                        <span className={proposal.nextFollowUpAt < today ? "text-red-300" : "text-dourado"}>
                                            {followUpLabel(proposal.nextFollowUpAt, today)}
                                        </span>
                                    ) : (
                                        "Sem data"
                                    )}
                                </Fact>
                            </dl>

                            {attemptsWithoutReply >= ATTEMPTS_BEFORE_CLOSING && (
                                <p className="mt-4 rounded-lg border border-dourado/40 px-3 py-2 text-sm text-admin-text">
                                    Já foram {attemptsWithoutReply} tentativas sem resposta. Hora da mensagem de encerramento.
                                </p>
                            )}

                            <div className="mt-5 flex flex-wrap items-start gap-3">
                                <a
                                    href={whatsappUrl(client.phoneNumber)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-lg border border-admin-line px-3 py-2 text-sm text-admin-text transition-colors duration-150 hover:border-dourado"
                                >
                                    Abrir WhatsApp
                                </a>
                                <div className="min-w-0 flex-1">
                                    <ClaudeButton label="Escrever follow-up com o Claude" prompt={prompt} />
                                </div>
                            </div>

                            <div className="mt-6 border-t border-admin-line pt-5">
                                <FollowUpForm key={proposal.contacts.length} proposalId={proposal.id} today={today} />
                            </div>
                        </section>
                    )}

                    <Card title="Itens">
                        <ul className="divide-y divide-admin-line">
                            {proposal.items.map((item) => {
                                const discount = toDiscount(item.discountType, item.discountValue);
                                return (
                                    <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-3 py-2.5 text-sm">
                                        <span className="min-w-0 text-admin-text">
                                            {item.quantity > 1 && <span className="text-admin-muted">{item.quantity}× </span>}
                                            {item.description}
                                        </span>
                                        <span className="tabular-nums text-admin-text">
                                            {formatBRL(itemSubtotal({ ...item, discount }))}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                        {proposal.discountType && proposal.discountValue !== null && (
                            <p className="mt-2 text-right text-sm text-admin-muted">
                                Desconto geral:{" "}
                                {proposal.discountType === "percentage"
                                    ? `${proposal.discountValue}%`
                                    : formatBRL(proposal.discountValue)}
                            </p>
                        )}
                        <p className="mt-3 flex justify-between border-t border-admin-line pt-3 font-medium">
                            <span>Total</span>
                            <span className="tabular-nums">{formatBRL(total)}</span>
                        </p>
                    </Card>

                    {proposal.bonuses.length > 0 && (
                        <Card title="Bônus">
                            <ul className="space-y-1.5 text-sm">
                                {proposal.bonuses.map((bonus) => {
                                    const value = bonusDisplayValue(bonus, proposal.hostingMonthly);
                                    return (
                                        <li key={bonus.id} className="flex justify-between gap-3">
                                            <span className="text-admin-text">{bonus.title}</span>
                                            {value !== null && (
                                                <span className="tabular-nums text-admin-muted">{formatBRL(value)}</span>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </Card>
                    )}
                </div>

                <div className="space-y-8">
                    <Card title="Condições">
                        <dl className="space-y-3 text-sm">
                            <Fact label="Prazo de entrega">{proposal.deliveryDays} dias</Fact>
                            <Fact label="Hospedagem e manutenção">
                                {proposal.hostingMonthly === null ? "Não incluída" : `${formatBRL(proposal.hostingMonthly)}/mês`}
                            </Fact>
                            <Fact label="Forma de pagamento">
                                {proposal.paymentMethod
                                    ? paymentLabel(proposal.paymentMethod, total, proposal.cardInstallments)
                                    : proposal.status === "approved"
                                      ? "Não informada"
                                      : "Escolhida pelo cliente na aprovação"}
                            </Fact>
                        </dl>
                    </Card>

                    <Card title="Cliente">
                        <dl className="space-y-3 text-sm">
                            <Fact label="Nome">
                                <Link href={`/clientes/${client.id}`} className="hover:text-dourado">
                                    {client.name}
                                </Link>
                            </Fact>
                            <Fact label="WhatsApp">{formatPhone(client.phoneNumber)}</Fact>
                            {client.email && <Fact label="E-mail">{client.email}</Fact>}
                            {proposal.lead && (
                                <Fact label="Lead de origem">
                                    <Link href={`/leads/${proposal.lead.id}`} className="hover:text-dourado">
                                        {proposal.lead.businessName}
                                    </Link>
                                </Fact>
                            )}
                        </dl>
                    </Card>

                    {proposal.contacts.length > 0 && (
                        <Card title={`Histórico · ${proposal.contacts.length}`}>
                            <ol className="space-y-4">
                                {proposal.contacts.map((contact) => (
                                    <li
                                        key={contact.id}
                                        className={`border-l-2 pl-3 ${contact.clientReplied ? "border-admin-success" : "border-admin-line"}`}
                                    >
                                        <p className="text-xs text-admin-muted">
                                            {dateTime.format(contact.createdAt)} · {contactChannelLabel[contact.channel]}
                                            {contact.clientReplied && <span className="text-admin-success"> · cliente respondeu</span>}
                                        </p>
                                        {contact.note && (
                                            <p className="mt-0.5 text-sm whitespace-pre-line text-admin-text">{contact.note}</p>
                                        )}
                                    </li>
                                ))}
                            </ol>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
}

function paymentLabel(method: "pix" | "split" | "card", total: number, installments: number | null) {
    switch (method) {
        case "pix":
            return `Pix à vista · ${formatBRL(pixTotal(total))}`;
        case "split": {
            const [entry, rest] = splitPayment(total);
            return `50% + 50% · ${formatBRL(entry)} na entrada e ${formatBRL(rest)} na entrega`;
        }
        case "card":
            return installments
                ? `Cartão em ${installments}× de ${formatBRL(installmentAmount(total, installments))}`
                : "Cartão";
    }
}

function daysLabel(days: number) {
    if (days === 0) return "hoje";
    return `há ${days} ${days === 1 ? "dia" : "dias"}`;
}

function Timeline({ steps }: { steps: { label: string; at: Date | null; note?: string }[] }) {
    return (
        <ol className="admin-card mt-6 grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 sm:p-5">
            {steps.map((step) => (
                <li key={step.label} className="flex items-start gap-2.5">
                    <span
                        aria-hidden="true"
                        className={`mt-1.5 size-2 shrink-0 rounded-full ${step.at ? "bg-dourado" : "border border-admin-line"}`}
                    />
                    <div className="min-w-0">
                        <p className={`text-sm ${step.at ? "text-admin-text" : "text-admin-muted"}`}>{step.label}</p>
                        <p className="text-xs text-admin-muted">
                            {step.at ? dateTime.format(step.at) : "—"}
                            {step.note && ` · ${step.note}`}
                        </p>
                    </div>
                </li>
            ))}
        </ol>
    );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="min-w-0">
            <dt className="text-xs text-admin-muted">{label}</dt>
            <dd className="text-admin-text wrap-break-word">{children}</dd>
        </div>
    );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="admin-card p-4 sm:p-5">
            <h2 className="mb-4 font-display text-lg font-medium">{title}</h2>
            {children}
        </section>
    );
}

function FichaSkeleton() {
    return (
        <div aria-hidden="true" className="space-y-6">
            <div className="h-16 w-2/3 animate-pulse rounded-xl bg-white/[0.04]" />
            <div className="h-20 animate-pulse rounded-2xl bg-white/[0.04]" />
            <div className="h-64 animate-pulse rounded-2xl bg-white/[0.04]" />
        </div>
    );
}

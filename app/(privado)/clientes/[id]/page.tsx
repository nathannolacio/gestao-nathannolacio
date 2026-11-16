import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import * as z from "zod";
import { db } from "@/db";
import { missingContractFields } from "@/lib/client-contract";
import { formatDocument } from "@/lib/document";
import { formatPhone, leadSourceLabel, whatsappUrl } from "@/lib/leads";
import { formatBRL, totalFromRows } from "@/lib/proposal-calc";
import { PageHeader, buttonPrimary, buttonSecondary } from "../../_components/page-header";
import { StatusBadge } from "../../propostas/_components/status-badge";

type FichaClienteProps = { params: Promise<{ id: string }> };

const dateOnly = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
});

// A página só repassa a promessa; o `await` fica dentro do Suspense (cacheComponents).
export default function FichaCliente({ params }: FichaClienteProps) {
    return (
        <Suspense fallback={<FichaSkeleton />}>
            <Ficha params={params} />
        </Suspense>
    );
}

async function Ficha({ params }: FichaClienteProps) {
    await connection();
    const { id } = await params;

    // O id vem da URL: valida antes de consultar (um texto qualquer quebraria o cast para uuid).
    if (!z.uuid().safeParse(id).success) notFound();

    const client = await db.query.clients.findFirst({
        where: { id, deletedAt: { isNull: true } },
        with: {
            proposals: {
                where: { deletedAt: { isNull: true } },
                with: { items: true },
                orderBy: { createdAt: "desc" },
            },
            // Clientes antigos não têm lead (cadastrados direto na proposta): a origem fica em branco.
            leads: {
                columns: { id: true, businessName: true, source: true, referredBy: true },
                orderBy: { createdAt: "asc" },
                limit: 1,
            },
        },
    });

    if (!client) notFound();

    const missing = missingContractFields(client);
    const lead = client.leads[0] ?? null;
    const address = [
        [client.street, client.addressNumber].filter(Boolean).join(", "),
        client.addressComplement,
        client.neighborhood,
        [client.city, client.state].filter(Boolean).join("/"),
        client.zipCode && client.zipCode.replace(/(\d{5})(\d{3})/, "$1-$2"),
    ]
        .filter(Boolean)
        .join(" · ");

    return (
        <>
            <PageHeader
                back={{ href: "/clientes", label: "Clientes" }}
                title={client.name}
                description={[client.type === "PF" ? "Pessoa física" : "Pessoa jurídica", `cliente desde ${dateOnly.format(client.createdAt)}`].join(" · ")}
                actions={
                    <>
                        <a
                            href={whatsappUrl(client.phoneNumber)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={buttonSecondary}
                        >
                            Abrir WhatsApp
                        </a>
                        <Link href={`/clientes/${client.id}/editar`} className={buttonPrimary}>
                            Editar
                        </Link>
                    </>
                }
            >
                <div className="mt-2">
                    <span
                        className={`inline-block rounded-full border px-2.5 py-1 text-xs ${
                            missing.length === 0 ? "border-dourado/50 text-dourado" : "border-admin-line text-admin-muted"
                        }`}
                    >
                        {missing.length === 0 ? "Pronto para contrato" : `Contrato: falta ${missing.join(", ")}`}
                    </span>
                </div>
            </PageHeader>

            <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                <Card title={`Propostas · ${client.proposals.length}`}>
                    {client.proposals.length === 0 ? (
                        <p className="text-sm text-admin-muted">Nenhuma proposta para este cliente.</p>
                    ) : (
                        <ul className="divide-y divide-admin-line">
                            {client.proposals.map((proposal) => (
                                <li key={proposal.id}>
                                    <Link
                                        href={`/propostas/${proposal.id}`}
                                        className="-mx-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg px-2 py-3 transition-colors duration-150 hover:bg-white/[0.03]"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-admin-text wrap-break-word">{proposal.title}</p>
                                            <p className="text-xs text-admin-muted">
                                                Criada em {dateOnly.format(proposal.createdAt)}
                                            </p>
                                        </div>
                                        <span className="text-sm tabular-nums text-admin-text">
                                            {formatBRL(totalFromRows(proposal))}
                                        </span>
                                        <StatusBadge status={proposal.status} />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                <div className="space-y-8">
                    <Card title="Contato">
                        <dl className="space-y-3 text-sm">
                            <Fact label="WhatsApp">{formatPhone(client.phoneNumber)}</Fact>
                            <Fact label="E-mail">{client.email ?? "—"}</Fact>
                            <Fact label="Origem">
                                {lead ? (
                                    <Link href={`/leads/${lead.id}`} className="hover:text-dourado">
                                        {leadSourceLabel[lead.source]}
                                        {lead.referredBy && ` (${lead.referredBy})`} · ver lead
                                    </Link>
                                ) : (
                                    "—"
                                )}
                            </Fact>
                        </dl>
                    </Card>

                    <Card title="Dados do contrato">
                        <dl className="space-y-3 text-sm">
                            <Fact label={client.type === "PF" ? "Nome completo" : "Razão social"}>
                                {client.legalName ?? "—"}
                            </Fact>
                            <Fact label={client.type === "PF" ? "CPF" : "CNPJ"}>
                                {formatDocument(client.document) || "—"}
                            </Fact>
                            <Fact label="Endereço">{address || "—"}</Fact>
                            {client.type === "PJ" && (
                                <Fact label="Responsável legal">
                                    {client.legalRepName
                                        ? [client.legalRepName, client.legalRepRole, formatDocument(client.legalRepDocument)]
                                              .filter(Boolean)
                                              .join(" · ")
                                        : "—"}
                                </Fact>
                            )}
                        </dl>
                        {missing.length > 0 && (
                            <Link
                                href={`/clientes/${client.id}/editar`}
                                className="mt-4 inline-block text-sm text-dourado hover:underline"
                            >
                                Completar dados do contrato
                            </Link>
                        )}
                    </Card>
                </div>
            </div>
        </>
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
            <div className="h-64 animate-pulse rounded-2xl bg-white/[0.04]" />
        </div>
    );
}

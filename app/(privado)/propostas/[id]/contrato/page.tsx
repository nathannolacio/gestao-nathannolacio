import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import * as z from "zod";
import { db } from "@/db";
import { SITE_URL } from "@/lib/claude-prompts";
import { contractKindLabel, guessContractKind, type ContractInputs } from "@/lib/contracts";
import { formatDocument } from "@/lib/document";
import { formatPhone, todayInSaoPaulo } from "@/lib/leads";
import { formatCentsAsReais } from "@/lib/money";
import { totalFromRows } from "@/lib/proposal-calc";
import { ContractForm } from "../../../contratos/_components/contract-form";
import { PageHeader } from "../../../_components/page-header";

type GerarContratoProps = { params: Promise<{ id: string }> };

const dateOnly = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
});

const dateTime = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
});

// A página só repassa a promessa; o `await` fica dentro do Suspense (cacheComponents).
export default function GerarContrato({ params }: GerarContratoProps) {
    return (
        <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-2xl bg-white/[0.04]" />}>
            <Tela params={params} />
        </Suspense>
    );
}

async function Tela({ params }: GerarContratoProps) {
    await connection();
    const { id } = await params;

    // O id vem da URL: valida antes de consultar (um texto qualquer quebraria o cast para uuid).
    if (!z.uuid().safeParse(id).success) notFound();

    const [proposal, lastContract] = await Promise.all([
        db.query.proposals.findFirst({
            where: { id, deletedAt: { isNull: true } },
            with: {
                client: true,
                items: { orderBy: { position: "asc" } },
                contracts: { where: { deletedAt: { isNull: true } }, orderBy: { createdAt: "desc" } },
            },
        }),
        // Seus dados (endereço, e-mail, WhatsApp) vêm do último contrato gerado, de qualquer proposta.
        db.query.contracts.findFirst({ orderBy: { createdAt: "desc" }, columns: { inputs: true } }),
    ]);

    if (!proposal || !proposal.client) notFound();

    const client = proposal.client;
    const draft = proposal.status === "draft";

    const address = [
        [client.street, client.addressNumber].filter(Boolean).join(", "),
        client.addressComplement,
        client.neighborhood,
        [client.city, client.state].filter(Boolean).join("/"),
        client.zipCode && `CEP ${client.zipCode.replace(/(\d{5})(\d{3})/, "$1-$2")}`,
    ]
        .filter(Boolean)
        .join(", ");

    const monthly = proposal.hostingMonthly === null ? "" : formatCentsAsReais(proposal.hostingMonthly);

    // Tudo calculado na hora a partir do que está salvo; nada disso vai para o banco antes de "Gerar".
    const initialInputs: ContractInputs = {
        cliente_nome: client.legalName ?? "",
        cliente_documento: formatDocument(client.document),
        // Endereço só entra se estiver completo: meio endereço no contrato é pior que o aviso de "falta".
        cliente_endereco: client.street && client.addressNumber && client.city && client.state && client.zipCode ? address : "",
        cliente_email: client.email ?? "",
        cliente_whatsapp: formatPhone(client.phoneNumber),
        cliente_negocio: client.name,
        meu_endereco: lastContract?.inputs.meu_endereco ?? "",
        meu_email: lastContract?.inputs.meu_email ?? "",
        meu_whatsapp: lastContract?.inputs.meu_whatsapp ?? "",
        proposta_data: proposal.sentAt ? dateOnly.format(proposal.sentAt) : "",
        proposta_link: `${SITE_URL}/proposta/${proposal.publicToken}`,
        data_contrato: todayInSaoPaulo(),
        prazo_dias: String(proposal.deliveryDays),
        valor_total: formatCentsAsReais(totalFromRows(proposal)),
        pagamento: proposal.paymentMethod ?? "",
        cartao_parcelas: proposal.cardInstallments ? String(proposal.cardInstallments) : "",
        plano_mensal: monthly,
        mensalidade: monthly,
        catalogo_endereco: "",
    };

    return (
        <>
            <PageHeader
                back={{ href: `/propostas/${proposal.id}`, label: proposal.title }}
                title="Contrato"
                description={`${client.name} · os dados vêm da proposta e do cadastro do cliente.`}
            />

            {proposal.contracts.length > 0 && (
                <section className="admin-card mt-6 p-4 sm:p-5">
                    <h2 className="mb-2 font-display text-lg font-medium">Contratos gerados</h2>
                    <ul className="divide-y divide-admin-line">
                        {proposal.contracts.map((contract) => (
                            <li key={contract.id}>
                                <Link
                                    href={`/contratos/${contract.id}`}
                                    className="-mx-2 flex flex-wrap items-center justify-between gap-3 rounded-lg px-2 py-3 text-sm transition-colors duration-150 hover:bg-white/[0.03]"
                                >
                                    <span className="font-medium text-admin-text">{contractKindLabel[contract.kind]}</span>
                                    <span className="text-admin-muted">Gerado em {dateTime.format(contract.createdAt)}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <section className="admin-card mt-6 p-4 sm:p-5">
                <h2 className="mb-4 font-display text-lg font-medium">
                    {proposal.contracts.length > 0 ? "Gerar outro contrato" : "Gerar contrato"}
                </h2>
                {draft ? (
                    <p className="text-sm text-admin-muted">
                        A proposta ainda é um rascunho. Envie a proposta antes de gerar o contrato.
                    </p>
                ) : (
                    <>
                        {(!client.legalName || !client.document || !initialInputs.cliente_endereco || !client.email) && (
                            <p className="mb-6 text-sm text-admin-muted">
                                Dica: para não digitar de novo no próximo contrato deste cliente,{" "}
                                <Link href={`/clientes/${client.id}/editar`} className="text-dourado hover:underline">
                                    complete o cadastro dele
                                </Link>{" "}
                                e volte aqui.
                            </p>
                        )}
                        <ContractForm
                            proposalId={proposal.id}
                            initialKind={guessContractKind(proposal.items.map((item) => item.description))}
                            initialInputs={initialInputs}
                        />
                    </>
                )}
            </section>
        </>
    );
}

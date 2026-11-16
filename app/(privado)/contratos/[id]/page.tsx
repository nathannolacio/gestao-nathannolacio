import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import * as z from "zod";
import { db } from "@/db";
import { contractKindLabel } from "@/lib/contracts";
import { PageHeader } from "../../_components/page-header";
import { ContractToolbar } from "../_components/contract-toolbar";

// Rótulos em negrito, como no modelo em Word: "CONTRATANTE:", "CONTRATADO:" e "a) Etapa 1 – Layout:".
// Devolve nós do React (nada de HTML), então o texto continua escapado.
function boldLabel(paragraph: string) {
    const match = /^((?:[a-z]\) )?(?:CONTRATANTE:|CONTRATADO:|Etapa \d – [^:]{1,60}:))/.exec(paragraph);
    if (!match) return paragraph;
    return (
        <>
            <strong>{match[1]}</strong>
            {paragraph.slice(match[1].length)}
        </>
    );
}

type ContratoProps = { params: Promise<{ id: string }> };

const dateTime = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
});

// A página só repassa a promessa; o `await` fica dentro do Suspense (cacheComponents).
export default function Contrato({ params }: ContratoProps) {
    return (
        <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-2xl bg-white/[0.04]" />}>
            <Documento params={params} />
        </Suspense>
    );
}

async function Documento({ params }: ContratoProps) {
    await connection();
    const { id } = await params;

    // O id vem da URL: valida antes de consultar (um texto qualquer quebraria o cast para uuid).
    if (!z.uuid().safeParse(id).success) notFound();

    const contract = await db.query.contracts.findFirst({
        where: { id, deletedAt: { isNull: true } },
        with: { proposal: { columns: { id: true, title: true }, with: { client: { columns: { name: true } } } } },
    });

    if (!contract || !contract.proposal) notFound();

    // O texto é guardado puro (sem HTML): parágrafos separados por linha em branco. Aqui só decide o estilo
    // de cada parágrafo; o React escapa o conteúdo, então nada digitado nos campos vira marcação.
    const paragraphs = contract.body.trim().split(/\n{2,}/);

    return (
        <>
            <PageHeader
                back={{ href: `/propostas/${contract.proposal.id}`, label: contract.proposal.title }}
                title={`Contrato · ${contractKindLabel[contract.kind]}`}
                description={`${contract.proposal.client?.name ?? ""} · gerado em ${dateTime.format(contract.createdAt)}. O texto não muda mais, mesmo se o modelo for editado.`}
                actions={<ContractToolbar id={contract.id} body={contract.body} proposalId={contract.proposal.id} />}
            />

            <article className="contract-sheet mx-auto mt-6 max-w-3xl rounded-xl bg-white px-6 py-8 font-[Arial,Helvetica,sans-serif] text-[15px] leading-relaxed text-neutral-900 shadow-2xl sm:px-12 sm:py-12">
                {paragraphs.map((paragraph, index) => {
                    if (index === 0) {
                        return (
                            <h2 key={index} className="mb-8 text-center text-base font-bold">
                                {paragraph}
                            </h2>
                        );
                    }
                    if (/^(CLÁUSULA|ANEXO)\b/.test(paragraph)) {
                        return (
                            <h3 key={index} className="mt-7 mb-3 font-bold [break-after:avoid]">
                                {paragraph}
                            </h3>
                        );
                    }
                    // Bloco de assinatura: linha, nome (negrito) e papel, sem quebrar entre páginas.
                    if (paragraph.startsWith("____")) {
                        const [line, name, ...role] = paragraph.split("\n");
                        return (
                            <p key={index} className="mt-10 [break-inside:avoid]">
                                {line}
                                <br />
                                <strong>{name}</strong>
                                {role.map((text) => (
                                    <span key={text}>
                                        <br />
                                        {text}
                                    </span>
                                ))}
                            </p>
                        );
                    }
                    // Alíneas (a), b)...) e opções de pagamento ficam recuadas, como no documento do Word.
                    const previous = paragraphs[index - 1] ?? "";
                    const indented = /^[a-z]\) /.test(paragraph) || (previous.endsWith(":") && !/^(CONTRATANTE|CONTRATADO):/.test(previous));
                    return (
                        <p key={index} className={`mb-3 text-justify whitespace-pre-line ${indented ? "pl-8" : ""}`}>
                            {boldLabel(paragraph)}
                        </p>
                    );
                })}
            </article>
        </>
    );
}

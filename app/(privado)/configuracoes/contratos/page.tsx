import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { db } from "@/db";
import {
    contractKindLabel,
    contractKinds,
    defaultContractBody,
    templateFieldNames,
    templateFlagNames,
    type ContractKind,
} from "@/lib/contracts";
import { PageHeader } from "../../_components/page-header";
import { TemplateEditor } from "../../contratos/_components/template-editor";

type ModelosProps = { searchParams: Promise<{ modelo?: string }> };

export default function ModelosDeContrato({ searchParams }: ModelosProps) {
    return (
        <>
            <PageHeader
                title="Modelos de contrato"
                description="O texto base de cada tipo de contrato. Mudar aqui vale para os próximos; contratos já gerados não mudam."
            />
            <div className="mt-6">
                <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-2xl bg-white/[0.04]" />}>
                    <Editor searchParams={searchParams} />
                </Suspense>
            </div>
        </>
    );
}

async function Editor({ searchParams }: ModelosProps) {
    await connection();
    const { modelo } = await searchParams;

    // O parâmetro vem da URL: só vale se for um dos tipos conhecidos.
    const kind: ContractKind = contractKinds.find((k) => k === modelo) ?? "site";

    const saved = await db.query.contractTemplates.findFirst({ where: { kind } });

    return (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
            <section className="admin-card p-4 sm:p-5">
                <nav aria-label="Modelo" className="mb-4 flex flex-wrap gap-2">
                    {contractKinds.map((k) => (
                        <Link
                            key={k}
                            href={`/configuracoes/contratos?modelo=${k}`}
                            aria-current={k === kind ? "page" : undefined}
                            className={`rounded-lg border px-3 py-2 text-sm transition-colors duration-150 ${
                                k === kind
                                    ? "border-dourado text-admin-text"
                                    : "border-admin-line text-admin-muted hover:text-admin-text"
                            }`}
                        >
                            {contractKindLabel[k]}
                        </Link>
                    ))}
                </nav>
                <p className="mb-3 text-xs text-admin-muted">
                    {saved ? "Você está usando um texto editado por você." : "Você está usando o texto padrão."}
                </p>
                {/* key: troca de aba ou "voltar ao padrão" recria o editor com o texto certo. */}
                <TemplateEditor
                    key={`${kind}-${saved?.updatedAt.getTime() ?? "padrao"}`}
                    kind={kind}
                    initialBody={saved?.body ?? defaultContractBody[kind]}
                    customized={Boolean(saved)}
                />
            </section>

            <aside className="admin-card p-4 text-sm sm:p-5">
                <h2 className="mb-2 font-display text-lg font-medium">Campos</h2>
                <p className="text-admin-muted">
                    O que estiver entre chaves duplas é trocado pelos dados na hora de gerar. Pode mover, repetir ou
                    apagar; não invente campos novos.
                </p>
                <ul className="mt-3 space-y-1 font-mono text-xs text-admin-text">
                    {templateFieldNames.map((name) => (
                        <li key={name}>{`{{${name}}}`}</li>
                    ))}
                </ul>
                <h3 className="mt-5 mb-1 font-medium text-admin-text">Trechos condicionais</h3>
                <p className="text-admin-muted">
                    O texto entre a abertura e o fechamento só entra quando a condição vale (forma de pagamento escolhida).
                </p>
                <ul className="mt-3 space-y-1 font-mono text-xs text-admin-text">
                    {templateFlagNames.map((name) => (
                        <li key={name}>{`{{#se ${name}}} ... {{/se}}`}</li>
                    ))}
                </ul>
            </aside>
        </div>
    );
}

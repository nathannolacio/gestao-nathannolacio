import Link from "next/link";
import { importColumns } from "@/lib/lead-import";
import { ImportForm } from "../_components/import-form";
import { ProspectingPrompt } from "../_components/prospecting-prompt";

export default function ImportarLeads() {
    return (
        <>
            <Link href="/leads" className="text-sm text-admin-muted hover:text-admin-text">
                ← Leads
            </Link>
            <h1 className="mt-2 font-display text-2xl font-medium tracking-tight">Importar lista</h1>
            <p className="mt-2 max-w-3xl text-sm text-admin-muted">
                Cole as linhas da planilha (separadas por tab) ou de um CSV com ponto e vírgula. Colunas, nesta ordem:{" "}
                <code className="text-admin-text">{importColumns.join("; ")}</code>. Com cabeçalho, a ordem pode ser
                qualquer uma. Todos entram como <strong className="text-admin-text">Novo</strong>, origem Prospecção
                ativa. Quem já está no sistema (mesmo WhatsApp, Instagram ou nome), inclusive ganhos, perdidos e
                arquivados, é pulado.
            </p>

            <div className="mt-6 max-w-5xl space-y-8">
                <ProspectingPrompt />
                <section>
                    <h2 className="mb-3 font-display text-lg font-medium">2. Colar e importar</h2>
                    <ImportForm />
                </section>
            </div>
        </>
    );
}

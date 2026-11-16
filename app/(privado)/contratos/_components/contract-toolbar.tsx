"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveContract } from "../actions";
import { buttonPrimary, buttonSecondary } from "../../_components/page-header";

// Ações do contrato gerado. "Imprimir / Salvar PDF" usa a impressão do navegador: o CSS de impressão
// (globals.css) mostra só a folha do contrato, e em "Destino" dá para escolher "Salvar como PDF".
export function ContractToolbar({ id, body, proposalId }: { id: string; body: string; proposalId: string }) {
    const router = useRouter();
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    async function copy() {
        try {
            await navigator.clipboard.writeText(body);
            setCopied(true);
        } catch {
            setError("Não foi possível copiar. Selecione o texto e copie à mão.");
        }
    }

    function archive() {
        if (!window.confirm("Arquivar este contrato? Ele some da proposta; você pode gerar outro depois.")) return;
        setError(null);
        startTransition(async () => {
            const res = await archiveContract({ id });
            if (!res.ok) {
                setError(res.formError);
                return;
            }
            router.push(`/propostas/${proposalId}/contrato`);
        });
    }

    return (
        <div className="flex flex-col items-end gap-1">
            <div className="flex flex-wrap items-center justify-end gap-2">
                <button type="button" onClick={archive} disabled={pending} className={`${buttonSecondary} cursor-pointer disabled:opacity-50`}>
                    Arquivar
                </button>
                <button type="button" onClick={copy} className={`${buttonSecondary} cursor-pointer`}>
                    {copied ? "Texto copiado" : "Copiar texto"}
                </button>
                <button type="button" onClick={() => window.print()} className={`${buttonPrimary} cursor-pointer`}>
                    Imprimir / Salvar PDF
                </button>
            </div>
            {error && (
                <p role="alert" className="text-xs text-red-300">
                    {error}
                </p>
            )}
        </div>
    );
}

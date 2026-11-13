"use client";

import { useEffect, useState } from "react";
import { CLAUDE_PROJECT_URL } from "@/lib/claude-prompts";
import type { ProspectingBatchInput } from "@/lib/schemas/lead";
import { inputClass } from "@/app/(privado)/propostas/_components/proposal-form";
import { MAX_IMPORT_ROWS } from "@/lib/lead-import";
import {
    buildProspectingPrompt,
    defaultPromptInput,
    type ProspectingOffer,
} from "@/lib/prospecting-prompt";

// Prompt base para pedir a lista a uma IA já no formato da importação. Nicho, cidades e quantidade
// preenchem o texto; o resto (regras A/B/C, gancho, formato das colunas) é fixo em lib/prospecting-prompt.ts.
// `onBatchChange`: avisa a tela de importação da oferta/nicho/cidades, que viram o lote de prospecção.
export function ProspectingPrompt({ onBatchChange }: { onBatchChange?: (batch: ProspectingBatchInput | null) => void }) {
    const [offer, setOffer] = useState<ProspectingOffer>(defaultPromptInput.offer);
    const [exclude, setExclude] = useState(defaultPromptInput.exclude);
    const [niche, setNiche] = useState(defaultPromptInput.niche);
    const [cities, setCities] = useState(defaultPromptInput.cities);
    const [count, setCount] = useState(String(defaultPromptInput.count));
    const [copied, setCopied] = useState(false);

    const prompt = buildProspectingPrompt({ offer, niche, cities, count: Number(count), exclude });

    useEffect(() => {
        onBatchChange?.(niche.trim() && cities.trim() ? { offer, niche: niche.trim(), cities: cities.trim() } : null);
    }, [offer, niche, cities, onBatchChange]);

    // Copia e abre o projeto no Claude, que já conhece o negócio e o formato da importação.
    async function openInClaude() {
        await copy();
        window.open(CLAUDE_PROJECT_URL, "_blank", "noopener,noreferrer");
    }

    async function copy() {
        try {
            await navigator.clipboard.writeText(prompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Sem permissão de área de transferência: seleciona o texto para copiar à mão.
            document.getElementById("prospecting-prompt")?.focus();
            (document.getElementById("prospecting-prompt") as HTMLTextAreaElement | null)?.select();
        }
    }

    return (
        <details open className="group rounded-xl border border-admin-line p-4 sm:p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="font-display text-lg font-medium">1. Pedir a lista para a IA</span>
                <span aria-hidden="true" className="text-sm text-admin-muted transition-transform duration-150 group-open:rotate-180">
                    ▾
                </span>
            </summary>

            <p className="mt-3 text-sm text-admin-muted">
                Preencha, copie o prompt e cole no Claude (projeto Soluções Digitais, com busca na web). A resposta vem num bloco de código: copie o
                bloco inteiro e cole no passo 2.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_2fr_2fr_1fr]">
                <div>
                    <label htmlFor="prompt-offer" className="mb-1.5 block text-sm text-admin-muted">
                        Oferta
                    </label>
                    <select
                        id="prompt-offer"
                        value={offer}
                        onChange={(e) => setOffer(e.target.value as ProspectingOffer)}
                        className={inputClass}
                    >
                        <option value="site">Site</option>
                        <option value="menu">Cardápio</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="prompt-niche" className="mb-1.5 block text-sm text-admin-muted">
                        Nicho
                    </label>
                    <input
                        id="prompt-niche"
                        value={niche}
                        onChange={(e) => setNiche(e.target.value)}
                        placeholder="Ex.: doceria, dentista"
                        className={inputClass}
                    />
                </div>
                <div>
                    <label htmlFor="prompt-cities" className="mb-1.5 block text-sm text-admin-muted">
                        Cidades
                    </label>
                    <input
                        id="prompt-cities"
                        value={cities}
                        onChange={(e) => setCities(e.target.value)}
                        className={inputClass}
                    />
                </div>
                <div>
                    <label htmlFor="prompt-count" className="mb-1.5 block text-sm text-admin-muted">
                        Quantidade
                    </label>
                    <input
                        id="prompt-count"
                        type="number"
                        min={1}
                        max={MAX_IMPORT_ROWS}
                        value={count}
                        onChange={(e) => setCount(e.target.value)}
                        className={inputClass}
                    />
                </div>
            </div>

            <div className="mt-4">
                <label htmlFor="prompt-exclude" className="mb-1.5 block text-sm text-admin-muted">
                    Não incluir (opcional, um por linha)
                </label>
                <textarea
                    id="prompt-exclude"
                    rows={3}
                    value={exclude}
                    onChange={(e) => setExclude(e.target.value)}
                    placeholder="Negócios que você já tem ou já abordou"
                    className={inputClass}
                />
            </div>

            <label htmlFor="prospecting-prompt" className="sr-only">
                Prompt
            </label>
            <textarea
                id="prospecting-prompt"
                readOnly
                rows={12}
                value={prompt}
                className={`${inputClass} mt-4 font-mono text-xs`}
            />

            <div className="mt-3 flex items-center gap-3">
                <button
                    type="button"
                    onClick={copy}
                    className="cursor-pointer rounded-lg bg-dourado px-4 py-2 text-sm font-medium text-grafite transition-opacity duration-150 hover:opacity-90"
                >
                    Copiar prompt
                </button>
                <button
                    type="button"
                    onClick={openInClaude}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dourado/60 px-4 py-2 text-sm text-admin-text transition-colors duration-150 hover:bg-dourado/10"
                >
                    <span aria-hidden="true" className="text-dourado">✦</span>
                    Copiar e abrir no Claude
                </button>
                {copied && <p className="text-sm text-admin-success">Copiado.</p>}
            </div>
        </details>
    );
}

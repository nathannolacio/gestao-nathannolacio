"use client";

import { useState } from "react";
import { CLAUDE_PROJECT_URL } from "@/lib/claude-prompts";

// Etapa feita fora do sistema: copia o prompt (com os dados do lead) e abre o projeto no Claude.
// Lá é só colar. O texto também fica visível para conferir ou copiar de novo.
export function ClaudeButton({ label, prompt }: { label: string; prompt: string }) {
    const [copied, setCopied] = useState(false);

    async function handleClick() {
        try {
            await navigator.clipboard.writeText(prompt);
            setCopied(true);
        } catch {
            // Sem permissão de área de transferência: o texto continua disponível em "Ver prompt".
            setCopied(false);
        }
        window.open(CLAUDE_PROJECT_URL, "_blank", "noopener,noreferrer");
    }

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={handleClick}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dourado/60 px-3 py-2 text-sm text-admin-text transition-colors duration-150 hover:bg-dourado/10"
                >
                    <span aria-hidden="true" className="text-dourado">✦</span>
                    {label}
                </button>
                {copied && (
                    <span role="status" className="text-xs text-admin-success">
                        Prompt copiado. Cole no Claude.
                    </span>
                )}
            </div>
            <details className="text-xs text-admin-muted">
                <summary className="cursor-pointer hover:text-admin-text">Ver prompt</summary>
                <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-admin-raised/60 p-3 whitespace-pre-wrap text-admin-text">
                    {prompt}
                </pre>
            </details>
        </div>
    );
}

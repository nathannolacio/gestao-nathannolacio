"use client";

import { useState } from "react";
import type { ProspectingBatchInput } from "@/lib/schemas/lead";
import { ImportForm } from "./import-form";
import { ProspectingPrompt } from "./prospecting-prompt";

// Etapa 1 da jornada (Prospectar): o prompt vai para o Claude e a resposta volta para cá.
// A oferta/nicho/cidades do prompt viram o LOTE dos leads importados (para medir resposta por nicho).
export function ImportWorkspace() {
    const [batch, setBatch] = useState<ProspectingBatchInput | null>(null);

    return (
        <>
            <ProspectingPrompt onBatchChange={setBatch} />
            <section>
                <h2 className="mb-1 font-display text-lg font-medium">2. Colar e importar</h2>
                <p className="mb-3 text-sm text-admin-muted">
                    {batch
                        ? `Os leads entram no lote "${batch.niche} · ${batch.cities}".`
                        : "Preencha o nicho no passo 1 para registrar o lote (opcional)."}
                </p>
                <ImportForm batch={batch} />
            </section>
        </>
    );
}

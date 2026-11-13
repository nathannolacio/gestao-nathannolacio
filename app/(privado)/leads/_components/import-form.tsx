"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { importLeads, previewLeadImport } from "@/app/(privado)/leads/actions";
import { inputClass } from "@/app/(privado)/propostas/_components/proposal-form";
import { MAX_IMPORT_ROWS } from "@/lib/lead-import";
import type { ProspectingBatchInput } from "@/lib/schemas/lead";
import { PriorityBadge } from "./priority-badge";

type Preview = Extract<Awaited<ReturnType<typeof previewLeadImport>>, { ok: true }>;

const statusLabel = {
    ok: { text: "Entra", className: "text-admin-success" },
    duplicate: { text: "Duplicado", className: "text-admin-muted" },
    invalid: { text: "Com erro", className: "text-red-300" },
} as const;

// Dois passos: "Conferir" (o servidor separa, valida e marca duplicados, sem gravar) e "Importar"
// (o servidor refaz a mesma análise e grava só as linhas que entram).
// `batch`: oferta, nicho e cidades do prompt do passo 1; vira o lote de prospecção dos leads importados.
export function ImportForm({ batch }: { batch?: ProspectingBatchInput | null }) {
    const router = useRouter();
    const [text, setText] = useState("");
    const [preview, setPreview] = useState<Preview | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    const okCount = preview?.rows.filter((row) => row.status === "ok").length ?? 0;

    async function run(action: "preview" | "import") {
        setPending(true);
        setFormError(null);
        try {
            if (action === "preview") {
                const res = await previewLeadImport({ text });
                if (res.ok) setPreview(res);
                else setFormError(res.formError);
            } else {
                const res = await importLeads({ text, batch: batch ?? undefined });
                if (res.ok) {
                    router.push("/leads");
                    return;
                }
                setFormError(res.formError);
            }
        } catch {
            setFormError("Não foi possível processar a lista. Tente novamente.");
        } finally {
            setPending(false);
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <label htmlFor="import-text" className="mb-1.5 block text-sm text-admin-muted">
                    Lista
                </label>
                <textarea
                    id="import-text"
                    rows={10}
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        setPreview(null);
                    }}
                    placeholder={"negocio;contato;segmento;cidade;whatsapp;instagram;nota;previa_url;maps_url;gancho\nDoces da Maria;Maria;Doceria;Caieiras;5511912345678;@docesdamaria;A;https://...;https://maps.app.goo.gl/...;Com 110 avaliações no Google..."}
                    className={`${inputClass} font-mono text-xs`}
                    spellCheck={false}
                />
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    disabled={pending || text.trim() === ""}
                    onClick={() => run("preview")}
                    className="cursor-pointer rounded-lg border border-admin-line px-4 py-2 text-sm text-admin-text transition-colors duration-150 hover:border-dourado disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {pending && !preview ? "Conferindo..." : "Conferir"}
                </button>
                {preview && (
                    <button
                        type="button"
                        disabled={pending || okCount === 0}
                        onClick={() => run("import")}
                        className="cursor-pointer rounded-lg bg-dourado px-4 py-2 text-sm font-medium text-grafite transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {pending ? "Importando..." : `Importar ${okCount} ${okCount === 1 ? "lead" : "leads"}`}
                    </button>
                )}
                {formError && (
                    <p role="alert" className="text-sm text-red-300">
                        {formError}
                    </p>
                )}
            </div>

            {preview && (
                <div className="space-y-3">
                    {preview.tooMany && (
                        <p className="text-sm text-dourado">
                            Só as primeiras {MAX_IMPORT_ROWS} linhas foram lidas. Importe o resto depois.
                        </p>
                    )}
                    {preview.unknownHeaders.length > 0 && (
                        <p className="text-sm text-dourado">
                            Colunas ignoradas: {preview.unknownHeaders.join(", ")}.
                        </p>
                    )}
                    <div className="overflow-x-auto rounded-xl border border-admin-line">
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs text-admin-muted">
                                <tr className="border-b border-admin-line">
                                    <th className="px-3 py-2 font-normal">Linha</th>
                                    <th className="px-3 py-2 font-normal">Negócio</th>
                                    <th className="px-3 py-2 font-normal">Nota</th>
                                    <th className="px-3 py-2 font-normal">Contato</th>
                                    <th className="px-3 py-2 font-normal">Situação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-admin-line">
                                {preview.rows.map((row) => (
                                    <tr key={row.line} className="align-top">
                                        <td className="px-3 py-2 text-admin-muted">{row.line}</td>
                                        <td className="px-3 py-2 text-admin-text">{row.label}</td>
                                        <td className="px-3 py-2">
                                            {row.priority && <PriorityBadge priority={row.priority} />}
                                        </td>
                                        <td className="px-3 py-2 text-admin-muted">
                                            {[row.phone, row.instagram && `@${row.instagram}`, row.hasPreview && "prévia"]
                                                .filter(Boolean)
                                                .join(" · ")}
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className={statusLabel[row.status].className}>
                                                {statusLabel[row.status].text}
                                            </span>
                                            {row.message && (
                                                <span className="block text-xs text-admin-muted">{row.message}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

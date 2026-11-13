"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetContractTemplate, saveContractTemplate } from "../actions";
import { inputClass } from "../../propostas/_components/proposal-form";
import type { ContractKind } from "@/lib/contracts";

// Editor do modelo: é texto puro. Os campos entre {{chaves}} são trocados pelos dados na geração;
// o servidor recusa campo que não existe, para o erro aparecer aqui e não no contrato de um cliente.
export function TemplateEditor({
    kind,
    initialBody,
    customized,
}: {
    kind: ContractKind;
    initialBody: string;
    customized: boolean;
}) {
    const router = useRouter();
    const [body, setBody] = useState(initialBody);
    const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
    const [pending, startTransition] = useTransition();

    const dirty = body !== initialBody;

    function save() {
        setMessage(null);
        startTransition(async () => {
            const res = await saveContractTemplate({ kind, body });
            setMessage(res.ok ? { ok: true, text: "Modelo salvo. Vale para os próximos contratos." } : { ok: false, text: res.formError });
            if (res.ok) router.refresh();
        });
    }

    function reset() {
        if (!window.confirm("Voltar ao texto padrão? As suas alterações neste modelo serão perdidas.")) return;
        setMessage(null);
        startTransition(async () => {
            const res = await resetContractTemplate({ kind });
            if (!res.ok) {
                setMessage({ ok: false, text: res.formError });
                return;
            }
            router.refresh();
        });
    }

    return (
        <div className="space-y-3">
            <label htmlFor="template-body" className="sr-only">
                Texto do modelo
            </label>
            <textarea
                id="template-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={28}
                spellCheck={false}
                className={`${inputClass} font-mono text-[13px] leading-relaxed sm:text-[13px]`}
            />
            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={save}
                    disabled={pending || !dirty}
                    className="cursor-pointer rounded-lg bg-dourado px-4 py-2 text-sm font-medium text-grafite transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {pending ? "Salvando..." : "Salvar modelo"}
                </button>
                {customized && (
                    <button
                        type="button"
                        onClick={reset}
                        disabled={pending}
                        className="cursor-pointer rounded-lg border border-admin-line px-4 py-2 text-sm text-admin-muted transition-colors duration-150 hover:border-dourado hover:text-admin-text disabled:opacity-50"
                    >
                        Voltar ao texto padrão
                    </button>
                )}
                {message && (
                    <p role={message.ok ? "status" : "alert"} className={`text-sm ${message.ok ? "text-admin-success" : "text-red-300"}`}>
                        {message.text}
                    </p>
                )}
            </div>
        </div>
    );
}

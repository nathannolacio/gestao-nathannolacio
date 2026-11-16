"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { logProposalContact } from "../actions";
import { Field, inputClass } from "./proposal-form";
import { addDays, contactChannelLabel, contactChannels, type ContactChannel } from "@/lib/leads";

type FieldErrors = Record<string, string[] | undefined>;

const pillClass =
    "cursor-pointer rounded-lg border border-admin-line px-3 py-2 text-sm text-admin-muted " +
    "transition-colors duration-150 has-checked:border-dourado has-checked:text-admin-text " +
    "has-focus-visible:outline-2 has-focus-visible:outline-dourado";

const presetClass =
    "cursor-pointer rounded-md border border-admin-line px-2.5 py-1 text-xs text-admin-muted " +
    "transition-colors duration-150 hover:border-dourado hover:text-admin-text";

// Registrar follow-up de uma proposta enviada: o que foi feito e quando lembrar de novo.
// "Cliente respondeu" marca o contato como resposta (zera a contagem de tentativas sem retorno).
// `today` vem do servidor (fuso de São Paulo), para os atalhos de data não dependerem do relógio do aparelho.
export function FollowUpForm({ proposalId, today }: { proposalId: string; today: string }) {
    const router = useRouter();
    const [channel, setChannel] = useState<ContactChannel>("whatsapp");
    const [note, setNote] = useState("");
    const [clientReplied, setClientReplied] = useState(false);
    const [nextFollowUpAt, setNextFollowUpAt] = useState(addDays(today, 2));
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setPending(true);
        setFieldErrors({});
        setFormError(null);

        try {
            const res = await logProposalContact({ proposalId, channel, note, clientReplied, nextFollowUpAt });
            if (res.ok) {
                setNote("");
                setClientReplied(false);
                router.refresh();
                return;
            }
            setFieldErrors(res.fieldErrors);
            setFormError(res.formError ?? "Há campos com erro.");
        } catch {
            setFormError("Não foi possível registrar. Tente novamente.");
        } finally {
            setPending(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <fieldset>
                <legend className="mb-1.5 text-sm text-admin-text">Canal</legend>
                <div className="flex flex-wrap gap-2">
                    {contactChannels.map((c) => (
                        <label key={c} className={pillClass}>
                            <input
                                type="radio"
                                name="follow-up-channel"
                                value={c}
                                checked={channel === c}
                                onChange={() => setChannel(c)}
                                className="sr-only"
                            />
                            {contactChannelLabel[c]}
                        </label>
                    ))}
                </div>
            </fieldset>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-admin-text">
                <input
                    type="checkbox"
                    checked={clientReplied}
                    onChange={(e) => setClientReplied(e.target.checked)}
                    className="size-4 accent-dourado"
                />
                O cliente respondeu
            </label>

            <Field label={clientReplied ? "O que ele disse" : "O que você fez"} htmlFor="follow-up-note" errors={fieldErrors.note}>
                <textarea
                    id="follow-up-note"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={
                        clientReplied
                            ? "Ex.: gostou, vai ver com o sócio até sexta"
                            : "Ex.: mandei mensagem perguntando se ficou alguma dúvida"
                    }
                    className={inputClass}
                />
            </Field>

            <Field label="Próximo lembrete" htmlFor="follow-up-next" errors={fieldErrors.nextFollowUpAt}>
                <input
                    id="follow-up-next"
                    type="date"
                    value={nextFollowUpAt}
                    onChange={(e) => setNextFollowUpAt(e.target.value)}
                    className={`${inputClass} sm:max-w-56`}
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                        { label: "Amanhã", days: 1 },
                        { label: "2 dias", days: 2 },
                        { label: "3 dias", days: 3 },
                        { label: "1 semana", days: 7 },
                    ].map((p) => (
                        <button
                            key={p.days}
                            type="button"
                            onClick={() => setNextFollowUpAt(addDays(today, p.days))}
                            className={presetClass}
                        >
                            {p.label}
                        </button>
                    ))}
                    <button type="button" onClick={() => setNextFollowUpAt("")} className={presetClass}>
                        Sem lembrete
                    </button>
                </div>
            </Field>

            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="submit"
                    disabled={pending}
                    className="cursor-pointer rounded-lg bg-dourado px-4 py-2 text-sm font-medium text-grafite transition-opacity duration-150 hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
                >
                    {pending ? "Registrando..." : clientReplied ? "Registrar resposta" : "Registrar contato"}
                </button>
                {formError && (
                    <p role="alert" className="text-sm text-red-300">
                        {formError}
                    </p>
                )}
            </div>
        </form>
    );
}

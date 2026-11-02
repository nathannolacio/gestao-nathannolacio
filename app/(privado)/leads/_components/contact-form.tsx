"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { logLeadContact } from "@/app/(privado)/leads/actions";
import { Field, inputClass } from "@/app/(privado)/propostas/_components/proposal-form";
import {
    addDays,
    contactChannelLabel,
    contactChannels,
    isOpenStage,
    leadStageLabel,
    leadStages,
    type ContactChannel,
    type LeadStage,
} from "@/lib/leads";

type FieldErrors = Record<string, string[] | undefined>;

const pillClass =
    "cursor-pointer rounded-lg border border-admin-line px-3 py-2 text-sm text-admin-muted " +
    "transition-colors duration-150 has-checked:border-dourado has-checked:text-admin-text " +
    "has-focus-visible:outline-2 has-focus-visible:outline-dourado";

const presetClass =
    "cursor-pointer rounded-md border border-admin-line px-2.5 py-1 text-xs text-admin-muted " +
    "transition-colors duration-150 hover:border-dourado hover:text-admin-text";

// Primeiro contato com um lead novo já o move para "Contatado"; nos outros, mantém.
function suggestedStage(current: LeadStage): LeadStage {
    return current === "new" ? "contacted" : current;
}

// Registrar contato = o gesto do dia a dia: falei com o lead, anoto e marco o próximo passo.
// `today` vem do servidor (fuso de São Paulo), para os atalhos de data não dependerem do relógio do aparelho.
export function ContactForm({
    leadId,
    currentStage,
    today,
}: {
    leadId: string;
    currentStage: LeadStage;
    today: string;
}) {
    const router = useRouter();
    const [channel, setChannel] = useState<ContactChannel>("whatsapp");
    const [note, setNote] = useState("");
    const [stage, setStage] = useState<LeadStage>(suggestedStage(currentStage));
    const [lostReason, setLostReason] = useState("");
    const [nextFollowUpAt, setNextFollowUpAt] = useState(addDays(today, 3));
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    const open = isOpenStage(stage);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setPending(true);
        setFieldErrors({});
        setFormError(null);

        try {
            const res = await logLeadContact({
                leadId,
                channel,
                note,
                stage,
                lostReason,
                nextFollowUpAt: open ? nextFollowUpAt : "",
            });

            if (res.ok) {
                setNote("");
                setLostReason("");
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
                                name="channel"
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

            <Field label="O que aconteceu" htmlFor="note" errors={fieldErrors.note}>
                <textarea
                    id="note"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ex.: mandei a mensagem 1, respondeu que vai ver com o sócio"
                    className={inputClass}
                />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Estágio depois deste contato" htmlFor="contact-stage" errors={fieldErrors.stage}>
                    <select
                        id="contact-stage"
                        value={stage}
                        onChange={(e) => setStage(e.target.value as LeadStage)}
                        className={inputClass}
                    >
                        {leadStages.map((s) => (
                            <option key={s} value={s}>
                                {leadStageLabel[s]}
                            </option>
                        ))}
                    </select>
                </Field>

                {open ? (
                    <Field label="Próximo follow-up" htmlFor="contact-next" errors={fieldErrors.nextFollowUpAt}>
                        <input
                            id="contact-next"
                            type="date"
                            value={nextFollowUpAt}
                            onChange={(e) => setNextFollowUpAt(e.target.value)}
                            className={inputClass}
                        />
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {[
                                { label: "Amanhã", days: 1 },
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
                                Sem data
                            </button>
                        </div>
                    </Field>
                ) : (
                    stage === "lost" && (
                        <Field label="Motivo da perda" htmlFor="contact-lost" errors={fieldErrors.lostReason}>
                            <input
                                id="contact-lost"
                                value={lostReason}
                                onChange={(e) => setLostReason(e.target.value)}
                                placeholder="Ex.: sem orçamento, já tem site, sumiu"
                                className={inputClass}
                            />
                        </Field>
                    )
                )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="submit"
                    disabled={pending}
                    className="cursor-pointer rounded-lg bg-dourado px-4 py-2 text-sm font-medium text-grafite transition-opacity duration-150 hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
                >
                    {pending ? "Registrando..." : "Registrar contato"}
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

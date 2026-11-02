"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createLead, updateLead } from "@/app/(privado)/leads/actions";
import { Field, inputClass } from "@/app/(privado)/propostas/_components/proposal-form";
import {
    leadPriorities,
    leadPriorityHint,
    leadSourceLabel,
    leadSources,
    leadStageLabel,
    leadStages,
    isOpenStage,
    type LeadPriority,
    type LeadSource,
    type LeadStage,
} from "@/lib/leads";

// Tudo texto, no formato dos inputs; o servidor valida e limpa (só dígitos, "" vira nulo).
export type LeadFormValues = {
    businessName: string;
    contactName: string;
    segment: string;
    city: string;
    phone: string;
    instagram: string;
    source: LeadSource;
    referredBy: string;
    stage: LeadStage;
    lostReason: string;
    nextFollowUpAt: string;
    notes: string;
    priority: LeadPriority | "";
    hook: string;
    previewUrl: string;
    mapsUrl: string;
};

export const emptyLead: LeadFormValues = {
    businessName: "",
    contactName: "",
    segment: "",
    city: "",
    phone: "",
    instagram: "",
    source: "prospecting",
    referredBy: "",
    stage: "new",
    lostReason: "",
    nextFollowUpAt: "",
    notes: "",
    priority: "",
    hook: "",
    previewUrl: "",
    mapsUrl: "",
};

type FieldErrors = Record<string, string[] | undefined>;

// Sugestões para os campos de texto livre (não é catálogo fechado: dá para digitar outro).
const SEGMENTS = [
    "Food (doces e salgados)",
    "Restaurante / lanchonete",
    "Varejo local",
    "Beleza",
    "Saúde",
    "Profissional liberal",
    "Prestador de serviço",
];
const CITIES = ["Caieiras", "Franco da Rocha", "Francisco Morato", "Mairiporã"];

// Bimodal como o formulário de proposta: cria (vai para a ficha do lead) ou edita (fica na ficha).
type LeadFormProps =
    | { mode: "create"; initialValues?: LeadFormValues }
    | { mode: "edit"; leadId: string; initialValues: LeadFormValues };

export function LeadForm(props: LeadFormProps) {
    const router = useRouter();
    const [values, setValues] = useState(props.initialValues ?? emptyLead);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const [pending, setPending] = useState(false);

    function set<K extends keyof LeadFormValues>(key: K, value: LeadFormValues[K]) {
        setSaved(false);
        setValues((current) => ({ ...current, [key]: value }));
    }

    function text(key: keyof LeadFormValues, extra?: { list?: string; inputMode?: "tel" | "url" }) {
        return {
            id: key,
            value: values[key],
            onChange: (e: ChangeEvent<HTMLInputElement>) => set(key, e.target.value as never),
            autoComplete: "off",
            "aria-invalid": !!fieldErrors[key],
            className: inputClass,
            ...extra,
        };
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setPending(true);
        setFieldErrors({});
        setFormError(null);

        try {
            if (props.mode === "create") {
                const res = await createLead(values);
                if (res.ok) {
                    router.push(`/leads/${res.id}`);
                    return;
                }
                setFieldErrors(res.fieldErrors);
                setFormError(res.formError ?? "Há campos com erro.");
            } else {
                const res = await updateLead({ id: props.leadId, ...values });
                if (res.ok) {
                    setSaved(true);
                    router.refresh();
                    return;
                }
                setFieldErrors(res.fieldErrors);
                setFormError(res.formError ?? "Há campos com erro.");
            }
        } catch {
            setFormError("Não foi possível salvar. Tente novamente.");
        } finally {
            setPending(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome do negócio" htmlFor="businessName" errors={fieldErrors.businessName}>
                    <input {...text("businessName")} placeholder="Ex.: Doces da Maria" />
                </Field>
                <Field label="Nome do contato" htmlFor="contactName" errors={fieldErrors.contactName}>
                    <input {...text("contactName")} placeholder="Quem atende / decide" />
                </Field>
                <Field label="Segmento" htmlFor="segment" errors={fieldErrors.segment}>
                    <input {...text("segment", { list: "lead-segments" })} />
                    <datalist id="lead-segments">
                        {SEGMENTS.map((s) => (
                            <option key={s} value={s} />
                        ))}
                    </datalist>
                </Field>
                <Field label="Cidade" htmlFor="city" errors={fieldErrors.city}>
                    <input {...text("city", { list: "lead-cities" })} />
                    <datalist id="lead-cities">
                        {CITIES.map((c) => (
                            <option key={c} value={c} />
                        ))}
                    </datalist>
                </Field>
                <Field
                    label="WhatsApp"
                    htmlFor="phone"
                    hint="Com 55 e DDD. Ex.: 55 11 91234-5678"
                    errors={fieldErrors.phone}
                >
                    <input {...text("phone", { inputMode: "tel" })} />
                </Field>
                <Field label="Instagram" htmlFor="instagram" hint="@usuario ou link do perfil" errors={fieldErrors.instagram}>
                    <input {...text("instagram")} />
                </Field>
                <Field label="Origem" htmlFor="source" errors={fieldErrors.source}>
                    <select
                        id="source"
                        value={values.source}
                        onChange={(e) => set("source", e.target.value as LeadSource)}
                        className={inputClass}
                    >
                        {leadSources.map((s) => (
                            <option key={s} value={s}>
                                {leadSourceLabel[s]}
                            </option>
                        ))}
                    </select>
                </Field>
                {values.source === "referral" && (
                    <Field label="Indicado por" htmlFor="referredBy" errors={fieldErrors.referredBy}>
                        <input {...text("referredBy")} placeholder="Quem indicou" />
                    </Field>
                )}
            </div>

            <div className="grid gap-4 border-t border-admin-line pt-6 sm:grid-cols-2">
                <Field label="Estágio" htmlFor="stage" errors={fieldErrors.stage}>
                    <select
                        id="stage"
                        value={values.stage}
                        onChange={(e) => set("stage", e.target.value as LeadStage)}
                        className={inputClass}
                    >
                        {leadStages.map((s) => (
                            <option key={s} value={s}>
                                {leadStageLabel[s]}
                            </option>
                        ))}
                    </select>
                </Field>
                {isOpenStage(values.stage) ? (
                    <Field label="Próximo follow-up" htmlFor="nextFollowUpAt" errors={fieldErrors.nextFollowUpAt}>
                        <input {...text("nextFollowUpAt")} type="date" />
                    </Field>
                ) : (
                    values.stage === "lost" && (
                        <Field label="Motivo da perda" htmlFor="lostReason" errors={fieldErrors.lostReason}>
                            <input {...text("lostReason")} placeholder="Ex.: sem orçamento, já tem site, não respondeu" />
                        </Field>
                    )
                )}
            </div>

            <div className="grid gap-4 border-t border-admin-line pt-6 sm:grid-cols-2">
                <Field
                    label="Nota de prospecção"
                    htmlFor="priority"
                    hint={values.priority ? leadPriorityHint[values.priority] : "A, B ou C (opcional)"}
                    errors={fieldErrors.priority}
                >
                    <select
                        id="priority"
                        value={values.priority}
                        onChange={(e) => set("priority", e.target.value as LeadPriority | "")}
                        className={inputClass}
                    >
                        <option value="">Sem nota</option>
                        {leadPriorities.map((p) => (
                            <option key={p} value={p}>
                                {p}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Link da prévia" htmlFor="previewUrl" errors={fieldErrors.previewUrl}>
                    <input {...text("previewUrl", { inputMode: "url" })} placeholder="https://..." />
                </Field>
                <Field label="Link do Google Maps" htmlFor="mapsUrl" errors={fieldErrors.mapsUrl}>
                    <input {...text("mapsUrl", { inputMode: "url" })} placeholder="https://maps.app.goo.gl/..." />
                </Field>
                <Field
                    label="Gancho"
                    htmlFor="hook"
                    hint="Frase que entra na 1ª mensagem"
                    errors={fieldErrors.hook}
                >
                    <input {...text("hook")} placeholder="Ex.: Com 110 avaliações no Google, falta só o site." />
                </Field>
            </div>

            <Field label="Observações" htmlFor="notes" errors={fieldErrors.notes}>
                <textarea
                    id="notes"
                    rows={4}
                    value={values.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    className={inputClass}
                />
            </Field>

            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="submit"
                    disabled={pending}
                    className="cursor-pointer rounded-lg bg-dourado px-4 py-2 text-sm font-medium text-grafite transition-opacity duration-150 hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
                >
                    {pending ? "Salvando..." : props.mode === "create" ? "Cadastrar lead" : "Salvar dados"}
                </button>
                {saved && <p className="text-sm text-admin-success">Salvo.</p>}
                {formError && (
                    <p role="alert" className="text-sm text-red-300">
                        {formError}
                    </p>
                )}
            </div>
        </form>
    );
}

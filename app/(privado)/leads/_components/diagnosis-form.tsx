"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { saveLeadDiagnosis } from "@/app/(privado)/leads/actions";
import { inputClass } from "@/app/(privado)/propostas/_components/proposal-form";
import { diagnosisQuestions, type LeadDiagnosis } from "@/lib/leads";

// Roteiro fixo da reunião de diagnóstico. Dá para preencher durante a ligação e salvar no fim.
export function DiagnosisForm({ leadId, initial }: { leadId: string; initial: LeadDiagnosis | null }) {
    const router = useRouter();
    const [answers, setAnswers] = useState<LeadDiagnosis>(initial ?? {});
    const [pending, setPending] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setPending(true);
        setSaved(false);
        setError(null);

        try {
            const res = await saveLeadDiagnosis({ leadId, answers });
            if (res.ok) {
                setSaved(true);
                router.refresh();
                return;
            }
            setError(res.formError ?? "Alguma resposta passou do limite de 1000 caracteres.");
        } catch {
            setError("Não foi possível salvar. Tente novamente.");
        } finally {
            setPending(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {diagnosisQuestions.map((q, index) => (
                <div key={q.id} className="space-y-1.5">
                    <label htmlFor={`dx-${q.id}`} className="block text-sm text-admin-text">
                        <span className="mr-1.5 text-admin-muted">{index + 1}.</span>
                        {q.text}
                    </label>
                    <textarea
                        id={`dx-${q.id}`}
                        rows={2}
                        value={answers[q.id] ?? ""}
                        onChange={(e) => {
                            setSaved(false);
                            setAnswers((current) => ({ ...current, [q.id]: e.target.value }));
                        }}
                        className={inputClass}
                    />
                </div>
            ))}

            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="submit"
                    disabled={pending}
                    className="cursor-pointer rounded-lg border border-dourado px-4 py-2 text-sm text-admin-text transition-colors duration-150 hover:bg-dourado/10 disabled:cursor-wait disabled:opacity-60"
                >
                    {pending ? "Salvando..." : "Salvar diagnóstico"}
                </button>
                {saved && <p className="text-sm text-admin-success">Salvo.</p>}
                {error && (
                    <p role="alert" className="text-sm text-red-300">
                        {error}
                    </p>
                )}
            </div>
        </form>
    );
}

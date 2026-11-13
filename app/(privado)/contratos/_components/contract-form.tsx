"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { generateContract } from "../actions";
import { Field, inputClass } from "../../propostas/_components/proposal-form";
import {
    contractKindLabel,
    contractKinds,
    inputDefsFor,
    type ContractFieldErrors,
    type ContractInputs,
    type ContractKind,
    type ContractPayment,
} from "@/lib/contracts";

const pillClass =
    "cursor-pointer rounded-lg border border-admin-line px-3 py-2 text-sm text-admin-muted " +
    "transition-colors duration-150 has-checked:border-dourado has-checked:text-admin-text " +
    "has-focus-visible:outline-2 has-focus-visible:outline-dourado";

const paymentLabel: Record<ContractPayment, string> = {
    "": "Ainda não escolhida (o contrato sai com as três opções)",
    pix: "Pix à vista, com 10% de desconto",
    split: "50% na assinatura + 50% antes da publicação",
    card: "Cartão de crédito",
};

const groups = ["Cliente", "Seus dados", "Contrato"] as const;

// Tela de geração: os campos já chegam preenchidos com o que o sistema sabe (cliente, proposta e os
// seus dados do último contrato). O que está vazio aparece marcado como "Falta". Tudo pode ser ajustado
// antes de gerar; o servidor confere de novo e monta o texto.
export function ContractForm({
    proposalId,
    initialKind,
    initialInputs,
}: {
    proposalId: string;
    initialKind: ContractKind;
    initialInputs: ContractInputs;
}) {
    const router = useRouter();
    const [kind, setKind] = useState<ContractKind>(initialKind);
    const [inputs, setInputs] = useState<ContractInputs>(initialInputs);
    const [fieldErrors, setFieldErrors] = useState<ContractFieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    const defs = inputDefsFor(kind).filter((def) => def.key !== "cartao_parcelas" || inputs.pagamento === "card");
    const missing = defs.filter((def) => !inputs[def.key].trim());

    function set<K extends keyof ContractInputs>(key: K, value: ContractInputs[K]) {
        setInputs((current) => ({ ...current, [key]: value }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setPending(true);
        setFieldErrors({});
        setFormError(null);

        try {
            const res = await generateContract({ proposalId, kind, inputs });
            if (res.ok) {
                router.push(`/contratos/${res.id}`);
                return;
            }
            setFieldErrors(res.fieldErrors);
            setFormError(res.formError);
        } catch {
            setFormError("Não foi possível gerar o contrato. Tente novamente.");
        } finally {
            setPending(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-8">
            <fieldset>
                <legend className="mb-1.5 text-sm text-admin-text">Modelo</legend>
                <div className="flex flex-wrap gap-2">
                    {contractKinds.map((k) => (
                        <label key={k} className={pillClass}>
                            <input
                                type="radio"
                                name="contract-kind"
                                value={k}
                                checked={kind === k}
                                onChange={() => setKind(k)}
                                className="sr-only"
                            />
                            {contractKindLabel[k]}
                        </label>
                    ))}
                </div>
            </fieldset>

            {missing.length > 0 && (
                <p className="rounded-lg border border-dourado/40 px-3 py-2 text-sm text-admin-text">
                    {missing.length === 1 ? "Falta 1 dado" : `Faltam ${missing.length} dados`} para este contrato:{" "}
                    {missing.map((def) => def.label).join(", ")}.
                </p>
            )}

            {groups.map((group) => {
                const groupDefs = defs.filter((def) => def.group === group);
                if (groupDefs.length === 0) return null;
                return (
                    <section key={group} aria-label={group}>
                        <h3 className="mb-3 text-xs font-medium tracking-wider text-admin-muted uppercase">{group}</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {group === "Contrato" && kind === "site" && (
                                <div className="sm:col-span-2">
                                    <Field label="Forma de pagamento" htmlFor="contract-pagamento">
                                        <select
                                            id="contract-pagamento"
                                            value={inputs.pagamento}
                                            onChange={(e) => set("pagamento", e.target.value as ContractPayment)}
                                            className={inputClass}
                                        >
                                            {(Object.keys(paymentLabel) as ContractPayment[]).map((option) => (
                                                <option key={option} value={option}>
                                                    {paymentLabel[option]}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                </div>
                            )}
                            {groupDefs.map((def) => {
                                const id = `contract-${def.key}`;
                                const error = fieldErrors[def.key];
                                const empty = !inputs[def.key].trim();
                                const wide = def.key === "cliente_endereco" || def.key === "meu_endereco" || def.key === "proposta_link";
                                return (
                                    <div key={def.key} className={wide ? "sm:col-span-2" : undefined}>
                                        <Field
                                            label={empty ? `${def.label} · falta` : def.label}
                                            htmlFor={id}
                                            hint={def.hint}
                                            errors={error ? [error] : undefined}
                                        >
                                            <input
                                                id={id}
                                                type={def.type === "date" ? "date" : "text"}
                                                inputMode={def.type === "number" ? "numeric" : def.type === "money" ? "decimal" : undefined}
                                                value={inputs[def.key]}
                                                onChange={(e) => set(def.key, e.target.value)}
                                                aria-invalid={error ? true : undefined}
                                                className={`${inputClass} ${empty && !error ? "border-dourado/60" : ""}`}
                                            />
                                        </Field>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                );
            })}

            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="submit"
                    disabled={pending}
                    className="cursor-pointer rounded-lg bg-dourado px-4 py-2 text-sm font-medium text-grafite transition-opacity duration-150 hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
                >
                    {pending ? "Gerando..." : "Gerar contrato"}
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

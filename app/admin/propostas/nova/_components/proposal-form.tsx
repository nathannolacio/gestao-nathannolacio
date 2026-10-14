"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createProposal } from "@/app/admin/propostas/actions";
import { bonusCatalog } from "@/lib/proposal-bonuses";

type ClientOption = { id: string; name: string };
type FieldErrors = Record<string, string[] | undefined>;

const inputClass =
    "w-full rounded-lg border border-admin-line bg-admin-raised px-3 py-2.5 text-sm text-admin-text " +
    "placeholder:text-admin-muted/60 focus-visible:outline-2 focus-visible:outline-offset-0 " +
    "focus-visible:outline-dourado aria-invalid:border-red-400/70";

const pillClass =
    "cursor-pointer rounded-lg border border-admin-line px-3 py-2 text-sm text-admin-muted " +
    "transition-colors duration-150 has-checked:border-dourado has-checked:text-admin-text " +
    "has-focus-visible:outline-2 has-focus-visible:outline-dourado";

// Só para exibição: o valor do bônus vem em centavos.
function formatCents(cents: number) {
    return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ProposalForm({ clients }: { clients: ClientOption[] }) {
    const router = useRouter();

    const [clientMode, setClientMode] = useState<"existing" | "new">(
        clients.length > 0 ? "existing" : "new",
    );
    const [clientId, setClientId] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [type, setType] = useState<"PF" | "PJ">("PF");

    const [title, setTitle] = useState("");
    const [deliveryDays, setDeliveryDays] = useState("");
    const [hostingAnnual, setHostingAnnual] = useState("");
    const [discountType, setDiscountType] = useState<"" | "percentage" | "fixed">("");
    const [discountValue, setDiscountValue] = useState("");
    const [bonuses, setBonuses] = useState<string[]>(bonusCatalog.map((b) => b.id));

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    function toggleBonus(id: string) {
        setBonuses((current) =>
            current.includes(id) ? current.filter((b) => b !== id) : [...current, id],
        );
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setPending(true);
        setFieldErrors({});
        setFormError(null);

        // O servidor valida e converte tudo (reais → centavos); aqui só enviamos o texto.
        const payload = {
            client:
                clientMode === "existing"
                    ? { clientMode, clientId }
                    : { clientMode, name, email, phone, type },
            title,
            deliveryDays,
            bonuses,
            hostingAnnual,
            discountType,
            discountValue,
        };

        try {
            const res = await createProposal(payload);

            if (res.ok) {
                router.push("/admin/propostas");
                return;
            }

            setFieldErrors(res.fieldErrors);
            setFormError(res.formError);
        } catch {
            setFormError("Não foi possível criar a proposta. Tente novamente.");
        } finally {
            setPending(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="max-w-2xl space-y-10">
            {formError && (
                <p role="alert" className="rounded-lg border border-red-400/40 px-4 py-3 text-sm text-red-300">
                    {formError}
                </p>
            )}

            {/* Cliente */}
            <section aria-labelledby="secao-cliente" className="space-y-4">
                <h2 id="secao-cliente" className="font-display text-lg font-medium">
                    Cliente
                </h2>

                <fieldset className="flex gap-2">
                    <legend className="sr-only">Tipo de seleção do cliente</legend>
                    {clients.length > 0 && (
                        <label className={pillClass}>
                            <input
                                type="radio"
                                name="clientMode"
                                value="existing"
                                checked={clientMode === "existing"}
                                onChange={() => setClientMode("existing")}
                                className="sr-only"
                            />
                            Cliente existente
                        </label>
                    )}
                    <label className={pillClass}>
                        <input
                            type="radio"
                            name="clientMode"
                            value="new"
                            checked={clientMode === "new"}
                            onChange={() => setClientMode("new")}
                            className="sr-only"
                        />
                        Cliente novo
                    </label>
                </fieldset>

                {fieldErrors.client && (
                    <ul role="alert" className="space-y-1 text-sm text-red-300">
                        {fieldErrors.client.map((message) => (
                            <li key={message}>{message}</li>
                        ))}
                    </ul>
                )}

                {clientMode === "existing" ? (
                    <Field label="Cliente" htmlFor="clientId">
                        <select
                            id="clientId"
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                            className={inputClass}
                        >
                            <option value="">Selecione um cliente</option>
                            {clients.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </Field>
                ) : (
                    <div className="space-y-4">
                        <fieldset className="flex gap-2">
                            <legend className="sr-only">Tipo de cliente</legend>
                            {(["PF", "PJ"] as const).map((option) => (
                                <label key={option} className={pillClass}>
                                    <input
                                        type="radio"
                                        name="type"
                                        value={option}
                                        checked={type === option}
                                        onChange={() => setType(option)}
                                        className="sr-only"
                                    />
                                    {option === "PF" ? "Pessoa física" : "Pessoa jurídica"}
                                </label>
                            ))}
                        </fieldset>

                        <Field label={type === "PF" ? "Nome" : "Nome da empresa"} htmlFor="name">
                            <input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoComplete="off"
                                className={inputClass}
                            />
                        </Field>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="E-mail" htmlFor="email">
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="off"
                                    className={inputClass}
                                />
                            </Field>
                            <Field label="Telefone" htmlFor="phone" hint="Com 55 + DDD + número">
                                <input
                                    id="phone"
                                    type="tel"
                                    inputMode="tel"
                                    placeholder="55 (11) 91234-5678"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    autoComplete="off"
                                    className={inputClass}
                                />
                            </Field>
                        </div>
                    </div>
                )}
            </section>

            {/* Proposta */}
            <section aria-labelledby="secao-proposta" className="space-y-4">
                <h2 id="secao-proposta" className="font-display text-lg font-medium">
                    Proposta
                </h2>

                <Field label="Título" htmlFor="title" errors={fieldErrors.title}>
                    <input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        autoComplete="off"
                        aria-invalid={!!fieldErrors.title}
                        className={inputClass}
                    />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                        label="Prazo de entrega (dias)"
                        htmlFor="deliveryDays"
                        errors={fieldErrors.deliveryDays}
                    >
                        <input
                            id="deliveryDays"
                            inputMode="numeric"
                            value={deliveryDays}
                            onChange={(e) => setDeliveryDays(e.target.value)}
                            autoComplete="off"
                            aria-invalid={!!fieldErrors.deliveryDays}
                            className={inputClass}
                        />
                    </Field>
                    <Field
                        label="Hospedagem anual (R$)"
                        htmlFor="hostingAnnual"
                        hint="Deixe vazio se o cliente tem hospedagem própria"
                        errors={fieldErrors.hostingAnnual}
                    >
                        <input
                            id="hostingAnnual"
                            inputMode="decimal"
                            placeholder="600,00"
                            value={hostingAnnual}
                            onChange={(e) => setHostingAnnual(e.target.value)}
                            autoComplete="off"
                            aria-invalid={!!fieldErrors.hostingAnnual}
                            className={inputClass}
                        />
                    </Field>
                </div>
            </section>

            {/* Desconto */}
            <section aria-labelledby="secao-desconto" className="space-y-4">
                <h2 id="secao-desconto" className="font-display text-lg font-medium">
                    Desconto geral <span className="text-sm font-normal text-admin-muted">(opcional)</span>
                </h2>

                <fieldset className="flex flex-wrap gap-2">
                    <legend className="sr-only">Tipo de desconto</legend>
                    {(
                        [
                            ["", "Sem desconto"],
                            ["percentage", "Percentual (%)"],
                            ["fixed", "Valor fixo (R$)"],
                        ] as const
                    ).map(([value, label]) => (
                        <label key={value} className={pillClass}>
                            <input
                                type="radio"
                                name="discountType"
                                value={value}
                                checked={discountType === value}
                                onChange={() => {
                                    setDiscountType(value);
                                    setDiscountValue("");
                                }}
                                className="sr-only"
                            />
                            {label}
                        </label>
                    ))}
                </fieldset>

                {fieldErrors.discountType && (
                    <p role="alert" className="text-sm text-red-300">
                        {fieldErrors.discountType[0]}
                    </p>
                )}

                {discountType !== "" && (
                    <Field
                        label={discountType === "percentage" ? "Desconto (%)" : "Desconto (R$)"}
                        htmlFor="discountValue"
                        errors={fieldErrors.discountValue}
                    >
                        <input
                            id="discountValue"
                            inputMode="decimal"
                            placeholder={discountType === "percentage" ? "10" : "50,00"}
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            autoComplete="off"
                            aria-invalid={!!fieldErrors.discountValue}
                            className={`${inputClass} max-w-48`}
                        />
                    </Field>
                )}
            </section>

            {/* Bônus */}
            <section aria-labelledby="secao-bonus" className="space-y-4">
                <div>
                    <h2 id="secao-bonus" className="font-display text-lg font-medium">
                        Bônus
                    </h2>
                    <p className="mt-1 text-sm text-admin-muted">
                        Desmarque o que não vale para este cliente (ele já tem ou não quer).
                    </p>
                </div>

                {fieldErrors.bonuses && (
                    <p role="alert" className="text-sm text-red-300">
                        {fieldErrors.bonuses[0]}
                    </p>
                )}

                <ul className="space-y-2">
                    {bonusCatalog.map((bonus) => (
                        <li key={bonus.id}>
                            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-admin-line px-4 py-3 has-checked:border-dourado/60">
                                <input
                                    type="checkbox"
                                    checked={bonuses.includes(bonus.id)}
                                    onChange={() => toggleBonus(bonus.id)}
                                    className="mt-1 size-4 accent-dourado"
                                />
                                <span className="text-sm">
                                    <span className="block font-medium text-admin-text">{bonus.title}</span>
                                    <span className="mt-0.5 block text-admin-muted">
                                        Valor agregado: {formatCents(bonus.value)}
                                    </span>
                                </span>
                            </label>
                        </li>
                    ))}
                </ul>
            </section>

            <div className="flex items-center gap-4">
                <button
                    type="submit"
                    disabled={pending}
                    className="rounded-lg bg-dourado px-5 py-2.5 text-sm font-medium text-grafite transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {pending ? "Criando..." : "Criar proposta"}
                </button>
                <p className="text-sm text-admin-muted">Os itens e valores entram na próxima etapa.</p>
            </div>
        </form>
    );
}

function Field({
    label,
    htmlFor,
    hint,
    errors,
    children,
}: {
    label: string;
    htmlFor: string;
    hint?: string;
    errors?: string[];
    children: ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={htmlFor} className="block text-sm text-admin-text">
                {label}
            </label>
            {children}
            {hint && !errors && <p className="text-xs text-admin-muted">{hint}</p>}
            {errors && (
                <p role="alert" className="text-sm text-red-300">
                    {errors[0]}
                </p>
            )}
        </div>
    );
}

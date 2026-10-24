"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateClient, uploadClientLogo } from "@/app/(privado)/clientes/actions";
import { Field, inputClass } from "@/app/(privado)/propostas/_components/proposal-form";

// Tudo texto, no formato dos inputs; o servidor valida e limpa (só dígitos, "" vira nulo).
export type ClientFormValues = {
    type: "PF" | "PJ";
    name: string;
    legalName: string;
    email: string;
    phone: string;
    document: string;
    zipCode: string;
    street: string;
    addressNumber: string;
    addressComplement: string;
    neighborhood: string;
    city: string;
    state: string;
    legalRepName: string;
    legalRepDocument: string;
    legalRepRole: string;
};

type FieldErrors = Record<string, string[] | undefined>;

const pillClass =
    "cursor-pointer rounded-lg border border-admin-line px-3 py-2 text-sm text-admin-muted " +
    "transition-colors duration-150 has-checked:border-dourado has-checked:text-admin-text " +
    "has-focus-visible:outline-2 has-focus-visible:outline-dourado";

export function ClientForm({
    clientId,
    initialValues,
    initialLogoUrl,
}: {
    clientId: string;
    initialValues: ClientFormValues;
    initialLogoUrl: string | null;
}) {
    const router = useRouter();
    const [values, setValues] = useState(initialValues);
    const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
    // Só enviamos a logo se ela mudou (trocou ou removeu).
    const [logoChanged, setLogoChanged] = useState(false);
    const [logoError, setLogoError] = useState<string | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    const isPJ = values.type === "PJ";

    function set<K extends keyof ClientFormValues>(key: K, value: ClientFormValues[K]) {
        setValues((current) => ({ ...current, [key]: value }));
    }

    // Props de um input de texto comum ligado ao estado.
    function text(key: keyof ClientFormValues, extra?: { autoComplete?: string }) {
        return {
            id: key,
            value: values[key],
            onChange: (e: ChangeEvent<HTMLInputElement>) => set(key, e.target.value),
            autoComplete: extra?.autoComplete ?? "off",
            "aria-invalid": !!fieldErrors[key],
            className: inputClass,
        };
    }

    async function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
        const input = event.currentTarget;
        const file = input.files?.[0];
        if (!file) return;

        setLogoError(null);
        setUploadingLogo(true);
        try {
            const formData = new FormData();
            formData.append("logo", file);
            const res = await uploadClientLogo(formData);

            if (res.ok) {
                setLogoUrl(res.url);
                setLogoChanged(true);
            } else {
                setLogoError(res.error);
            }
        } catch {
            setLogoError("Não foi possível enviar a logo. Tente novamente.");
        } finally {
            setUploadingLogo(false);
            input.value = ""; // permite escolher o mesmo arquivo de novo
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setPending(true);
        setFieldErrors({});
        setFormError(null);

        try {
            const res = await updateClient({
                id: clientId,
                ...values,
                logoUrl: logoChanged ? logoUrl : undefined,
            });

            if (res.ok) {
                router.push("/clientes");
                return;
            }

            setFieldErrors(res.fieldErrors);
            setFormError(
                res.formError ??
                    (Object.keys(res.fieldErrors).length > 0 ? "Há campos com erro. Confira acima." : null),
            );
        } catch {
            setFormError("Não foi possível salvar o cliente. Tente novamente.");
        } finally {
            setPending(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="max-w-2xl space-y-10">
            {/* Identificação */}
            <section aria-labelledby="secao-identificacao" className="space-y-4">
                <h2 id="secao-identificacao" className="font-display text-lg font-medium">
                    Identificação
                </h2>

                <fieldset className="flex flex-wrap gap-2">
                    <legend className="sr-only">Tipo de cliente</legend>
                    {(["PF", "PJ"] as const).map((option) => (
                        <label key={option} className={pillClass}>
                            <input
                                type="radio"
                                name="type"
                                value={option}
                                checked={values.type === option}
                                onChange={() => set("type", option)}
                                className="sr-only"
                            />
                            {option === "PF" ? "Pessoa física" : "Pessoa jurídica"}
                        </label>
                    ))}
                </fieldset>

                <Field
                    label={isPJ ? "Nome da empresa (aparece na capa)" : "Nome (aparece na capa)"}
                    htmlFor="name"
                    errors={fieldErrors.name}
                >
                    <input {...text("name")} />
                </Field>

                <Field
                    label={isPJ ? "Razão social" : "Nome completo"}
                    htmlFor="legalName"
                    hint="Como constará no contrato."
                    errors={fieldErrors.legalName}
                >
                    <input {...text("legalName")} />
                </Field>

                <Field
                    label={isPJ ? "CNPJ" : "CPF"}
                    htmlFor="document"
                    errors={fieldErrors.document}
                >
                    <input {...text("document")} inputMode="numeric" />
                </Field>

                <Field
                    label="Logo (opcional)"
                    htmlFor="logo"
                    hint="PNG, JPG ou WebP, até 2 MB. Sem logo, a capa mostra as iniciais."
                >
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                        {logoUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={logoUrl}
                                alt="Logo do cliente"
                                className="size-16 rounded-lg border border-admin-line bg-admin-raised object-contain p-1"
                            />
                        )}
                        <input
                            id="logo"
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleLogoChange}
                            disabled={uploadingLogo}
                            className="min-w-0 max-w-full text-sm text-admin-muted file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-admin-line file:bg-admin-raised file:px-3 file:py-2 file:text-sm file:text-admin-text"
                        />
                        {logoUrl && (
                            <button
                                type="button"
                                onClick={() => {
                                    setLogoUrl(null);
                                    setLogoChanged(true);
                                }}
                                className="py-2 text-sm text-admin-muted underline underline-offset-2 hover:text-admin-text"
                            >
                                Remover
                            </button>
                        )}
                    </div>
                    {uploadingLogo && <p className="mt-2 text-sm text-admin-muted">Enviando…</p>}
                    {logoError && (
                        <p role="alert" className="mt-2 text-sm text-red-300">
                            {logoError}
                        </p>
                    )}
                </Field>
            </section>

            {/* Contato */}
            <section aria-labelledby="secao-contato" className="space-y-4">
                <h2 id="secao-contato" className="font-display text-lg font-medium">
                    Contato
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="E-mail" htmlFor="email" errors={fieldErrors.email}>
                        <input {...text("email")} type="email" />
                    </Field>
                    <Field
                        label="WhatsApp"
                        htmlFor="phone"
                        hint="Com 55 + DDD + número"
                        errors={fieldErrors.phone}
                    >
                        <input {...text("phone")} type="tel" inputMode="tel" placeholder="55 (11) 91234-5678" />
                    </Field>
                </div>
            </section>

            {/* Endereço */}
            <section aria-labelledby="secao-endereco" className="space-y-4">
                <h2 id="secao-endereco" className="font-display text-lg font-medium">
                    Endereço
                </h2>
                <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="CEP" htmlFor="zipCode" errors={fieldErrors.zipCode}>
                        <input {...text("zipCode")} inputMode="numeric" />
                    </Field>
                    <div className="sm:col-span-2">
                        <Field label="Rua" htmlFor="street" errors={fieldErrors.street}>
                            <input {...text("street", { autoComplete: "off" })} />
                        </Field>
                    </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Número" htmlFor="addressNumber" errors={fieldErrors.addressNumber}>
                        <input {...text("addressNumber")} />
                    </Field>
                    <div className="sm:col-span-2">
                        <Field
                            label="Complemento"
                            htmlFor="addressComplement"
                            errors={fieldErrors.addressComplement}
                        >
                            <input {...text("addressComplement")} />
                        </Field>
                    </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-[1fr_1fr_6rem]">
                    <Field label="Bairro" htmlFor="neighborhood" errors={fieldErrors.neighborhood}>
                        <input {...text("neighborhood")} />
                    </Field>
                    <Field label="Cidade" htmlFor="city" errors={fieldErrors.city}>
                        <input {...text("city")} />
                    </Field>
                    <Field label="UF" htmlFor="state" errors={fieldErrors.state}>
                        <input {...text("state")} maxLength={2} className={`${inputClass} uppercase`} />
                    </Field>
                </div>
            </section>

            {/* Responsável legal: só PJ */}
            {isPJ && (
                <section aria-labelledby="secao-responsavel" className="space-y-4">
                    <h2 id="secao-responsavel" className="font-display text-lg font-medium">
                        Responsável legal
                    </h2>
                    <p className="text-xs text-admin-muted">Quem assina o contrato pela empresa.</p>
                    <Field label="Nome" htmlFor="legalRepName" errors={fieldErrors.legalRepName}>
                        <input {...text("legalRepName")} />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="CPF" htmlFor="legalRepDocument" errors={fieldErrors.legalRepDocument}>
                            <input {...text("legalRepDocument")} inputMode="numeric" />
                        </Field>
                        <Field label="Cargo" htmlFor="legalRepRole" errors={fieldErrors.legalRepRole}>
                            <input {...text("legalRepRole")} />
                        </Field>
                    </div>
                </section>
            )}

            <div className="space-y-3">
                {formError && (
                    <p role="alert" className="text-sm text-red-300">
                        {formError}
                    </p>
                )}
                <button
                    type="submit"
                    disabled={pending || uploadingLogo}
                    className="rounded-lg bg-dourado px-5 py-2.5 text-sm font-medium text-grafite transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {pending ? "Salvando…" : "Salvar cliente"}
                </button>
            </div>
        </form>
    );
}

"use client";

import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createProposal, updateProposal } from "@/app/(privado)/propostas/actions";
import { uploadClientLogo } from "@/app/(privado)/clientes/actions";
import { bonusCatalog, isRequiredBonus } from "@/lib/proposal-bonuses";
import { SCOPE_DESCRIPTION } from "@/lib/proposal-scope";

type ClientOption = { id: string; name: string };
type FieldErrors = Record<string, string[] | undefined>;

export const inputClass =
    "w-full rounded-lg border border-admin-line bg-admin-raised px-3 py-2.5 text-base text-admin-text sm:text-sm " +
    "placeholder:text-admin-muted/60 focus-visible:outline-2 focus-visible:outline-offset-0 " +
    "focus-visible:outline-dourado aria-invalid:border-red-400/70";

const pillClass =
    "cursor-pointer rounded-lg border border-admin-line px-3 py-2 text-sm text-admin-muted " +
    "transition-colors duration-150 has-checked:border-dourado has-checked:text-admin-text " +
    "has-focus-visible:outline-2 has-focus-visible:outline-dourado";

// Item em edição: tudo texto, o servidor valida e converte. `key` é só da tela (chave do React).
type ItemDraft = {
    key: string;
    description: string;
    quantity: string;
    unitPrice: string;
    discountType: "" | "percentage" | "fixed";
    discountValue: string;
    scopePages: PageDraft[];
    scopeIncluded: string[];
    scopeNotIncluded: string[];
};

// Página do escopo em edição (`key` só da tela). `sections`: uma seção por linha.
type PageDraft = { key: string; name: string; sections: string };

function newPage(): PageDraft {
    return { key: crypto.randomUUID(), name: "", sections: "" };
}

const MAX_ITEMS = 50;

function newItem(): ItemDraft {
    return {
        key: crypto.randomUUID(),
        description: "",
        quantity: "1",
        unitPrice: "",
        discountType: "",
        discountValue: "",
        scopePages: [newPage()],
        scopeIncluded: [],
        scopeNotIncluded: [],
    };
}

// Só para exibição: o valor do bônus vem em centavos.
function formatCents(cents: number) {
    return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Valores iniciais da edição: tudo TEXTO, no mesmo formato dos inputs ("1.500,00").
// Quem monta (a página de editar) converte centavos → texto com `formatCentsAsReais`.
export type ProposalFormValues = {
    title: string;
    deliveryDays: string;
    hostingMonthly: string;
    discountType: "" | "percentage" | "fixed";
    discountValue: string;
    bonuses: string[];
    items: (Omit<ItemDraft, "key" | "scopePages"> & {
        scopePages: Omit<PageDraft, "key">[];
    })[];
};

// Criar: escolhe/cadastra o cliente. Editar: o cliente é o já gravado (só leitura).
type ProposalFormProps =
    | { mode: "create"; clients: ClientOption[] }
    | {
          mode: "edit";
          proposalId: string;
          clientName: string;
          clientLogoUrl: string | null;
          status: "draft" | "sent";
          initialValues: ProposalFormValues;
      };

// Com cacheComponents o Next mantém a página anterior montada (e o estado dela).
// Trocar a `key` recria o formulário do zero, então o próximo "Nova proposta" nasce vazio.
// Na edição não há reset: recriar voltaria aos `initialValues` antigos.
export function ProposalForm(props: ProposalFormProps) {
    const [formKey, setFormKey] = useState(0);

    return (
        <ProposalFormFields
            key={formKey}
            {...props}
            onCreated={() => setFormKey((current) => current + 1)}
        />
    );
}

function ProposalFormFields(props: ProposalFormProps & { onCreated: () => void }) {
    const router = useRouter();
    const isEdit = props.mode === "edit";
    const clients = props.mode === "create" ? props.clients : [];
    const initial = props.mode === "edit" ? props.initialValues : null;

    const [clientMode, setClientMode] = useState<"existing" | "new">(
        clients.length > 0 ? "existing" : "new",
    );
    const [clientId, setClientId] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [type, setType] = useState<"PF" | "PJ">("PF");
    // URL devolvida pelo upload (a logo já está no Blob; a proposta só guarda o link).
    const [logoUrl, setLogoUrl] = useState<string | null>(
        props.mode === "edit" ? props.clientLogoUrl : null,
    );
    // Na edição só enviamos a logo se ela mudou (trocou ou removeu).
    const [logoChanged, setLogoChanged] = useState(false);
    const [logoError, setLogoError] = useState<string | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    const [title, setTitle] = useState(initial?.title ?? "");
    const [deliveryDays, setDeliveryDays] = useState(initial?.deliveryDays ?? "");
    const [hostingMonthly, setHostingMonthly] = useState(initial?.hostingMonthly ?? "");
    const [discountType, setDiscountType] = useState<"" | "percentage" | "fixed">(
        initial?.discountType ?? "",
    );
    const [discountValue, setDiscountValue] = useState(initial?.discountValue ?? "");
    const [bonuses, setBonuses] = useState<string[]>(
        initial?.bonuses ?? bonusCatalog.map((b) => b.id),
    );

    const [items, setItems] = useState<ItemDraft[]>(() =>
        initial
            ? initial.items.map((item) => ({
                  ...item,
                  key: crypto.randomUUID(),
                  // item sem escopo salvo: uma página vazia pronta para preencher
                  scopePages:
                      item.scopePages.length > 0
                          ? item.scopePages.map((page) => ({ ...page, key: crypto.randomUUID() }))
                          : [newPage()],
              }))
            : [newItem()],
    );

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    function toggleBonus(id: string) {
        if (isRequiredBonus(id)) return;
        setBonuses((current) =>
            current.includes(id) ? current.filter((b) => b !== id) : [...current, id],
        );
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

    function updateItem(key: string, changes: Partial<ItemDraft>) {
        setItems((current) =>
            current.map((item) => (item.key === key ? { ...item, ...changes } : item)),
        );
    }

    function updateScopePage(itemKey: string, pageKey: string, changes: Partial<PageDraft>) {
        setItems((current) =>
            current.map((item) =>
                item.key === itemKey
                    ? {
                          ...item,
                          scopePages: item.scopePages.map((page) =>
                              page.key === pageKey ? { ...page, ...changes } : page,
                          ),
                      }
                    : item,
            ),
        );
    }

    function addScopePage(itemKey: string) {
        setItems((current) =>
            current.map((item) =>
                item.key === itemKey ? { ...item, scopePages: [...item.scopePages, newPage()] } : item,
            ),
        );
    }

    function removeScopePage(itemKey: string, pageKey: string) {
        setItems((current) =>
            current.map((item) =>
                item.key === itemKey
                    ? { ...item, scopePages: item.scopePages.filter((page) => page.key !== pageKey) }
                    : item,
            ),
        );
    }

    function removeItem(key: string) {
        setItems((current) => current.filter((item) => item.key !== key));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setPending(true);
        setFieldErrors({});
        setFormError(null);

        // O servidor valida e converte tudo (reais → centavos); aqui só enviamos o texto.
        const fields = {
            title,
            deliveryDays,
            bonuses,
            items: items.map(({ key: _key, scopePages, ...item }) => ({
                ...item,
                scopePages: scopePages.map(({ key: _pageKey, ...page }) => page),
            })),
            hostingMonthly,
            discountType,
            discountValue,
        };

        try {
            const res =
                props.mode === "edit"
                    ? await updateProposal({
                          id: props.proposalId,
                          ...fields,
                          logoUrl: logoChanged ? logoUrl : undefined,
                      })
                    : await createProposal({
                          client:
                              clientMode === "existing"
                                  ? { clientMode, clientId }
                                  : {
                                        clientMode,
                                        name,
                                        email,
                                        phone,
                                        type,
                                        logoUrl: logoUrl ?? undefined,
                                    },
                          ...fields,
                      });

            if (res.ok) {
                router.push("/propostas");
                if (props.mode === "create") props.onCreated();
                return;
            }

            setFieldErrors(res.fieldErrors);
            setFormError(res.formError);
        } catch {
            setFormError(
                isEdit
                    ? "Não foi possível salvar a proposta. Tente novamente."
                    : "Não foi possível criar a proposta. Tente novamente.",
            );
        } finally {
            setPending(false);
        }
    }

    const logoField = (
        <Field
            label="Logo (opcional)"
            htmlFor="logo"
            hint={
                "PNG, JPG ou WebP, até 2 MB. Sem logo, a capa mostra as iniciais." +
                (isEdit ? " A logo é do cliente: vale para todas as propostas dele." : "")
            }
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
    );

    return (
        <form onSubmit={handleSubmit} noValidate className="max-w-2xl space-y-10">
            {props.mode === "edit" && props.status === "sent" && (
                <p className="rounded-lg border border-dourado/40 px-4 py-3 text-sm text-admin-text">
                    Esta proposta já foi enviada: as alterações aparecem para o cliente assim que
                    você salvar.
                </p>
            )}

            {/* Cliente */}
            {props.mode === "edit" ? (
            <section aria-labelledby="secao-cliente" className="space-y-2">
                <h2 id="secao-cliente" className="font-display text-lg font-medium">
                    Cliente
                </h2>
                <p className="text-sm text-admin-text">{props.clientName}</p>
                <p className="text-xs text-admin-muted">
                    O cliente de uma proposta não é alterado na edição.
                </p>
                {logoField}
            </section>
            ) : (
            <section aria-labelledby="secao-cliente" className="space-y-4">
                <h2 id="secao-cliente" className="font-display text-lg font-medium">
                    Cliente
                </h2>

                <fieldset className="flex flex-wrap gap-2">
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
                        <fieldset className="flex flex-wrap gap-2">
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
                            <Field label="E-mail (opcional)" htmlFor="email">
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

                        {logoField}
                    </div>
                )}
            </section>
            )}

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
                        label="Prazo de entrega (dias úteis)"
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
                        label="Hospedagem e manutenção mensal (R$)"
                        htmlFor="hostingMonthly"
                        hint="Deixe vazio se o cliente tem hospedagem própria"
                        errors={fieldErrors.hostingMonthly}
                    >
                        <input
                            id="hostingMonthly"
                            inputMode="decimal"
                            placeholder="79,00"
                            value={hostingMonthly}
                            onChange={(e) => setHostingMonthly(e.target.value)}
                            autoComplete="off"
                            aria-invalid={!!fieldErrors.hostingMonthly}
                            className={inputClass}
                        />
                    </Field>
                </div>
            </section>

            {/* Itens */}
            <section aria-labelledby="secao-itens" className="space-y-4">
                <h2 id="secao-itens" className="font-display text-lg font-medium">
                    Serviços e itens
                </h2>

                {fieldErrors.items && (
                    <ul role="alert" className="space-y-1 text-sm text-red-300">
                        {[...new Set(fieldErrors.items)].map((message) => (
                            <li key={message}>{message}</li>
                        ))}
                    </ul>
                )}

                <ul className="space-y-3">
                    {items.map((item, index) => (
                        <li
                            key={item.key}
                            className="space-y-3 rounded-lg border border-admin-line px-4 py-4"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-admin-text">
                                    Item {index + 1}
                                </span>
                                {items.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeItem(item.key)}
                                        className="-my-2 px-1 py-2 text-sm text-admin-muted transition-colors duration-150 hover:text-red-300 focus-visible:outline-2 focus-visible:outline-dourado"
                                    >
                                        Remover
                                    </button>
                                )}
                            </div>

                            <Field label="Descrição" htmlFor={`item-${item.key}-description`}>
                                <input
                                    id={`item-${item.key}-description`}
                                    value={item.description}
                                    onChange={(e) => updateItem(item.key, { description: e.target.value })}
                                    autoComplete="off"
                                    className={inputClass}
                                />
                            </Field>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Quantidade" htmlFor={`item-${item.key}-quantity`}>
                                    <input
                                        id={`item-${item.key}-quantity`}
                                        inputMode="numeric"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(item.key, { quantity: e.target.value })}
                                        autoComplete="off"
                                        className={inputClass}
                                    />
                                </Field>
                                <Field label="Valor unitário (R$)" htmlFor={`item-${item.key}-price`}>
                                    <input
                                        id={`item-${item.key}-price`}
                                        inputMode="decimal"
                                        placeholder="1.500,00"
                                        value={item.unitPrice}
                                        onChange={(e) => updateItem(item.key, { unitPrice: e.target.value })}
                                        autoComplete="off"
                                        className={inputClass}
                                    />
                                </Field>
                            </div>

                            <fieldset className="flex flex-wrap gap-2">
                                <legend className="sr-only">Desconto do item {index + 1}</legend>
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
                                            name={`item-${item.key}-discountType`}
                                            value={value}
                                            checked={item.discountType === value}
                                            onChange={() =>
                                                updateItem(item.key, { discountType: value, discountValue: "" })
                                            }
                                            className="sr-only"
                                        />
                                        {label}
                                    </label>
                                ))}
                            </fieldset>

                            {item.discountType !== "" && (
                                <Field
                                    label={
                                        item.discountType === "percentage"
                                            ? "Desconto do item (%)"
                                            : "Desconto do item (R$)"
                                    }
                                    htmlFor={`item-${item.key}-discountValue`}
                                >
                                    <input
                                        id={`item-${item.key}-discountValue`}
                                        inputMode="decimal"
                                        placeholder={item.discountType === "percentage" ? "10" : "50,00"}
                                        value={item.discountValue}
                                        onChange={(e) => updateItem(item.key, { discountValue: e.target.value })}
                                        autoComplete="off"
                                        className={`${inputClass} max-w-48`}
                                    />
                                </Field>
                            )}

                            {/* Escopo do item: opcional; na proposta vira a setinha que abre/fecha o item */}
                            <details className="rounded-lg border border-admin-line">
                                <summary className="cursor-pointer px-3 py-2 text-sm text-admin-muted">
                                    Escopo do item (opcional)
                                    {(item.scopeNotIncluded.length > 0 ||
                                        item.scopeIncluded.length > 0 ||
                                        item.scopePages.some((page) => page.name || page.sections)) &&
                                        " · preenchido"}
                                </summary>
                                <div className="space-y-3 px-3 pb-3">
                                    <p className="text-xs text-admin-muted">
                                        Fixos na proposta: a descrição ({SCOPE_DESCRIPTION}) e a nota de itens fora
                                        do escopo. Os totais de páginas e seções aparecem sozinhos.
                                    </p>
                                    {/* Páginas e suas seções. Página única: uma página, sem nome. */}
                                    <div className="space-y-3">
                                        <p className="text-sm text-admin-text">
                                            Páginas e seções{" "}
                                            <span className="text-xs text-admin-muted">
                                                (site de página única: uma página só, sem nome)
                                            </span>
                                        </p>
                                        {item.scopePages.map((page, pageIndex) => (
                                            <div
                                                key={page.key}
                                                className="space-y-2 rounded-lg border border-admin-line p-3"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <label
                                                        htmlFor={`item-${item.key}-page-${page.key}-name`}
                                                        className="text-sm text-admin-text"
                                                    >
                                                        Página {pageIndex + 1}
                                                    </label>
                                                    {item.scopePages.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeScopePage(item.key, page.key)}
                                                            className="text-sm text-admin-muted transition-colors duration-150 hover:text-red-300 focus-visible:outline-2 focus-visible:outline-dourado"
                                                        >
                                                            Remover página
                                                        </button>
                                                    )}
                                                </div>
                                                <input
                                                    id={`item-${item.key}-page-${page.key}-name`}
                                                    placeholder="Nome da página (ex.: Home). Vazio se for página única."
                                                    value={page.name}
                                                    onChange={(e) =>
                                                        updateScopePage(item.key, page.key, { name: e.target.value })
                                                    }
                                                    autoComplete="off"
                                                    className={inputClass}
                                                />
                                                <textarea
                                                    aria-label={`Seções da página ${pageIndex + 1} (uma por linha)`}
                                                    rows={5}
                                                    placeholder={"Seções, uma por linha:\nInício (com chamada para o WhatsApp)\nSobre\nServiços (até 6)"}
                                                    value={page.sections}
                                                    onChange={(e) =>
                                                        updateScopePage(item.key, page.key, {
                                                            sections: e.target.value,
                                                        })
                                                    }
                                                    className={inputClass}
                                                />
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => addScopePage(item.key)}
                                            disabled={item.scopePages.length >= 10}
                                            className="rounded-lg border border-admin-line px-3 py-1.5 text-sm text-admin-text transition-colors duration-150 hover:border-dourado disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-dourado"
                                        >
                                            Adicionar página
                                        </button>
                                    </div>
                                    <PillPicker
                                        legend="Incluso no site"
                                        value={item.scopeIncluded}
                                        onChange={(scopeIncluded) => updateItem(item.key, { scopeIncluded })}
                                    />
                                    <PillPicker
                                        legend="Não incluso"
                                        value={item.scopeNotIncluded}
                                        onChange={(scopeNotIncluded) => updateItem(item.key, { scopeNotIncluded })}
                                    />
                                </div>
                            </details>
                        </li>
                    ))}
                </ul>

                <button
                    type="button"
                    onClick={() => setItems((current) => [...current, newItem()])}
                    disabled={items.length >= MAX_ITEMS}
                    className="rounded-lg border border-admin-line px-4 py-2 text-sm text-admin-text transition-colors duration-150 hover:border-dourado disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-dourado"
                >
                    Adicionar item
                </button>
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
                        Desmarque o que não vale para este cliente (ele já tem ou não quer). Os 60 dias
                        de hospedagem e manutenção entram em toda proposta.
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
                            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-admin-line px-4 py-3 has-checked:border-dourado/60 has-disabled:cursor-default">
                                <input
                                    type="checkbox"
                                    checked={isRequiredBonus(bonus.id) || bonuses.includes(bonus.id)}
                                    disabled={isRequiredBonus(bonus.id)}
                                    onChange={() => toggleBonus(bonus.id)}
                                    className="mt-1 size-4 accent-dourado"
                                />
                                <span className="text-sm">
                                    <span className="block font-medium text-admin-text">{bonus.title}</span>
                                    <span className="mt-0.5 block text-admin-muted">
                                        Valor agregado: {formatCents(bonus.value)}
                                        {isRequiredBonus(bonus.id) && " · incluído em toda proposta"}
                                    </span>
                                </span>
                            </label>
                        </li>
                    ))}
                </ul>
            </section>

            <div className="space-y-3">
                {/* O erro fica junto do botão: é onde o olhar está depois de clicar. */}
                {(formError || Object.keys(fieldErrors).length > 0) && (
                    <p
                        role="alert"
                        className="rounded-lg border border-red-400/40 px-4 py-3 text-sm text-red-300"
                    >
                        {formError ?? "Há campos com erro. Revise o formulário e tente novamente."}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={pending}
                    className="rounded-lg bg-dourado px-5 py-2.5 text-sm font-medium text-grafite transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isEdit
                        ? pending
                            ? "Salvando..."
                            : "Salvar alterações"
                        : pending
                          ? "Criando..."
                          : "Criar proposta"}
                </button>
            </div>
        </form>
    );
}

// Pílulas de um grupo do escopo: digite e adicione (Enter ou botão); o × exclui qualquer uma.
function PillPicker({
    legend,
    value,
    onChange,
}: {
    legend: string;
    value: string[];
    onChange: (next: string[]) => void;
}) {
    const [draft, setDraft] = useState("");

    function add() {
        const text = draft.trim();
        if (text && !value.some((current) => current.toLowerCase() === text.toLowerCase())) {
            onChange([...value, text]);
        }
        setDraft("");
    }

    return (
        <fieldset className="space-y-2">
            <legend className="text-sm text-admin-text">{legend}</legend>

            {value.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                    {value.map((text) => (
                        <li
                            key={text}
                            className="inline-flex items-center gap-2 rounded-lg border border-dourado px-3 py-2 text-sm text-admin-text"
                        >
                            {text}
                            <button
                                type="button"
                                aria-label={`Excluir "${text}"`}
                                title="Excluir"
                                onClick={() => onChange(value.filter((current) => current !== text))}
                                className="text-admin-muted transition-colors duration-150 hover:text-red-300 focus-visible:outline-2 focus-visible:outline-dourado"
                            >
                                ×
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <div className="flex flex-wrap gap-2">
                <input
                    aria-label={`Adicionar pílula em "${legend}"`}
                    placeholder="Digite e adicione"
                    value={draft}
                    maxLength={100}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            add();
                        }
                    }}
                    autoComplete="off"
                    className={`${inputClass} max-w-xs`}
                />
                <button
                    type="button"
                    onClick={add}
                    className="rounded-lg border border-admin-line px-3 py-2 text-sm text-admin-text transition-colors duration-150 hover:border-dourado focus-visible:outline-2 focus-visible:outline-dourado"
                >
                    Adicionar
                </button>
            </div>
        </fieldset>
    );
}

export function Field({
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

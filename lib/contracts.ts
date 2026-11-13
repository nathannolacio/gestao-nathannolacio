// Geração do documento de contrato: modelo (texto com {{campos}}) + dados preenchidos = texto final.
// Sem IA: é só substituição de campos. O texto final é CONGELADO em `contracts.body` na geração,
// então editar o modelo depois não muda contratos já gerados (mesma ideia do `fixedContent` da proposta).
// Imports relativos com .ts: o arquivo pode ser lido por scripts fora do Next.

import { defaultCatalogContract, defaultSiteContract } from "./contract-defaults.ts";
import { formatDocument } from "./document.ts";
import { numeroPorExtenso, reaisPorExtenso } from "./extenso.ts";
import { parseReaisToCents } from "./money.ts";
import { formatBRL, pixTotal } from "./proposal-calc.ts";

export const contractKinds = ["site", "catalog"] as const;
export type ContractKind = (typeof contractKinds)[number];

export const contractKindLabel: Record<ContractKind, string> = {
    site: "Site",
    catalog: "Cardápio / Catálogo digital",
};

export const defaultContractBody: Record<ContractKind, string> = {
    site: defaultSiteContract,
    catalog: defaultCatalogContract,
};

export const contractPaymentOptions = ["", "pix", "split", "card"] as const;
export type ContractPayment = (typeof contractPaymentOptions)[number];

// O que a tela de geração pede (tudo texto, já vem preenchido com o que o sistema sabe).
export type ContractInputs = {
    cliente_nome: string;
    cliente_documento: string;
    cliente_endereco: string;
    cliente_email: string;
    cliente_whatsapp: string;
    cliente_negocio: string;
    meu_endereco: string;
    meu_email: string;
    meu_whatsapp: string;
    proposta_data: string;
    proposta_link: string;
    data_contrato: string; // AAAA-MM-DD
    prazo_dias: string;
    valor_total: string; // reais, "497,00"
    pagamento: ContractPayment;
    cartao_parcelas: string;
    plano_mensal: string; // reais
    mensalidade: string; // reais
    catalogo_endereco: string;
};

type InputType = "text" | "date" | "money" | "number";

export type ContractInputDef = {
    key: Exclude<keyof ContractInputs, "pagamento">;
    label: string;
    type: InputType;
    group: "Cliente" | "Seus dados" | "Contrato";
    kinds: readonly ContractKind[];
    hint?: string;
};

const both = contractKinds;

// Ordem = ordem dos campos na tela. Todos são obrigatórios para o modelo do tipo (exceto parcelas, só no cartão).
export const contractInputDefs: ContractInputDef[] = [
    { key: "cliente_nome", label: "Nome completo ou razão social", type: "text", group: "Cliente", kinds: both },
    { key: "cliente_documento", label: "CPF ou CNPJ", type: "text", group: "Cliente", kinds: both },
    { key: "cliente_endereco", label: "Endereço completo", type: "text", group: "Cliente", kinds: both },
    { key: "cliente_email", label: "E-mail", type: "text", group: "Cliente", kinds: both },
    { key: "cliente_whatsapp", label: "WhatsApp", type: "text", group: "Cliente", kinds: both },
    { key: "cliente_negocio", label: "Nome do negócio", type: "text", group: "Cliente", kinds: ["catalog"] },
    { key: "meu_endereco", label: "Seu endereço completo", type: "text", group: "Seus dados", kinds: both, hint: "Com cidade e UF. Fica lembrado para os próximos contratos." },
    { key: "meu_email", label: "Seu e-mail", type: "text", group: "Seus dados", kinds: both },
    { key: "meu_whatsapp", label: "Seu WhatsApp", type: "text", group: "Seus dados", kinds: both },
    { key: "proposta_data", label: "Data da proposta", type: "text", group: "Contrato", kinds: both, hint: "Como vai aparecer no texto, ex.: 12/11/2026." },
    { key: "proposta_link", label: "Link da proposta (Anexo I)", type: "text", group: "Contrato", kinds: both },
    { key: "data_contrato", label: "Data do contrato", type: "date", group: "Contrato", kinds: both },
    { key: "prazo_dias", label: "Prazo em dias úteis", type: "number", group: "Contrato", kinds: both },
    { key: "valor_total", label: "Valor total do projeto (R$)", type: "money", group: "Contrato", kinds: ["site"] },
    { key: "cartao_parcelas", label: "Parcelas no cartão", type: "number", group: "Contrato", kinds: ["site"] },
    { key: "plano_mensal", label: "Plano mensal (R$)", type: "money", group: "Contrato", kinds: ["site"], hint: "Hospedagem e manutenção, depois da cortesia." },
    { key: "mensalidade", label: "Mensalidade (R$)", type: "money", group: "Contrato", kinds: ["catalog"] },
    { key: "catalogo_endereco", label: "Endereço do catálogo", type: "text", group: "Contrato", kinds: ["catalog"], hint: "Subdomínio fornecido por você ou domínio do cliente." },
];

export function inputDefsFor(kind: ContractKind) {
    return contractInputDefs.filter((def) => def.kinds.includes(kind));
}

const MONTHS = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

// "2026-11-13" → "13 de novembro de 2026" (sem Date: a data não tem hora nem fuso).
export function dateInWords(isoDate: string) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
    if (!match) return null;
    const month = MONTHS[Number(match[2]) - 1];
    if (!month) return null;
    return `${Number(match[3])} de ${month} de ${match[1]}`;
}

export type ContractFieldErrors = Partial<Record<keyof ContractInputs, string>>;

type Built =
    | { ok: true; fields: Record<string, string>; flags: Record<string, boolean> }
    | { ok: false; errors: ContractFieldErrors };

// Transforma o que foi digitado nos campos do modelo: valores viram "R$ 497,00" + extenso, prazo vira
// "10 (dez)", data vira por extenso, e a forma de pagamento vira as condições dos trechos {{#se ...}}.
// Campo vazio ou inválido volta como erro (é o "aviso do que falta").
export function buildContractFields(kind: ContractKind, inputs: ContractInputs): Built {
    const errors: ContractFieldErrors = {};
    const fields: Record<string, string> = {};

    const cardChosen = kind === "site" && inputs.pagamento === "card";

    for (const def of inputDefsFor(kind)) {
        const value = inputs[def.key].trim();
        if (def.key === "cartao_parcelas" && !cardChosen) continue;

        if (!value) {
            errors[def.key] = "Preencha este campo.";
            continue;
        }

        if (def.type === "money") {
            const cents = parseReaisToCents(value);
            if (cents === null || cents === 0) {
                errors[def.key] = "Valor inválido. Use o formato 497,00.";
                continue;
            }
            fields[def.key] = formatBRL(cents);
            fields[`${def.key}_extenso`] = reaisPorExtenso(cents);
            if (def.key === "valor_total") fields.valor_pix = formatBRL(pixTotal(cents));
        } else if (def.type === "number") {
            const max = def.key === "cartao_parcelas" ? 3 : 365;
            if (!/^\d{1,3}$/.test(value) || Number(value) < 1 || Number(value) > max) {
                errors[def.key] = `Informe um número de 1 a ${max}.`;
                continue;
            }
            // Parcelas entram só como número; prazo entra como "10 (dez)".
            fields[def.key] = def.key === "cartao_parcelas" ? value : `${Number(value)} (${numeroPorExtenso(Number(value))})`;
        } else if (def.type === "date") {
            const words = dateInWords(value);
            if (!words) {
                errors[def.key] = "Data inválida.";
                continue;
            }
            fields[def.key] = words;
        } else if (def.key === "cliente_documento") {
            const digits = value.replace(/\D/g, "");
            if (digits.length !== 11 && digits.length !== 14) {
                errors[def.key] = "CPF tem 11 dígitos e CNPJ tem 14.";
                continue;
            }
            fields.cliente_documento = formatDocument(digits);
            fields.cliente_tipo_documento = digits.length === 11 ? "CPF" : "CNPJ";
        } else {
            fields[def.key] = value;
        }
    }

    if (Object.keys(errors).length > 0) return { ok: false, errors };

    // Sem forma escolhida (proposta ainda não aprovada), o contrato sai com as três opções e "( )",
    // como no modelo em papel. Com forma escolhida, sai só ela.
    const undecided = inputs.pagamento === "";
    fields.marcador = undecided ? "( ) " : "";
    if (!fields.cartao_parcelas) fields.cartao_parcelas = "____";

    return {
        ok: true,
        fields,
        flags: {
            pagamento_pix: undecided || inputs.pagamento === "pix",
            pagamento_dividido: undecided || inputs.pagamento === "split",
            pagamento_cartao: undecided || inputs.pagamento === "card",
        },
    };
}

const CONDITIONAL = /\{\{#se ([a-z_]+)\}\}([\s\S]*?)\{\{\/se\}\}/g;
const FIELD = /\{\{([a-z_]+)\}\}/g;

// Campos que o modelo pode usar (para a legenda do editor e para avisar de campo desconhecido).
export const templateFieldNames = [
    ...new Set([
        ...contractInputDefs.flatMap((def) => (def.type === "money" ? [def.key, `${def.key}_extenso`] : [def.key])),
        "cliente_tipo_documento",
        "valor_pix",
        "marcador",
    ]),
];
export const templateFlagNames = ["pagamento_pix", "pagamento_dividido", "pagamento_cartao"];

// Campos e condições citados no modelo que o sistema não conhece (erro de digitação no editor).
export function unknownTemplateTokens(body: string) {
    const unknown = new Set<string>();
    for (const match of body.matchAll(CONDITIONAL)) {
        if (!templateFlagNames.includes(match[1])) unknown.add(`{{#se ${match[1]}}}`);
    }
    for (const match of body.replace(CONDITIONAL, "$2").matchAll(FIELD)) {
        if (!templateFieldNames.includes(match[1])) unknown.add(`{{${match[1]}}}`);
    }
    // Sobra de "{{" depois de tirar o que é válido = marcação quebrada (ex.: {{#se}} sem fechar).
    const leftovers = body.replace(CONDITIONAL, "$2").replace(FIELD, "");
    if (leftovers.includes("{{") || leftovers.includes("}}")) unknown.add("marcação {{ }} incompleta");
    return [...unknown];
}

// Monta o texto final. Devolve também os campos que o modelo pede e ficaram sem valor (não deve
// acontecer se `buildContractFields` passou, mas o modelo é editável: a checagem é do texto real).
export function renderContract(body: string, fields: Record<string, string>, flags: Record<string, boolean>) {
    const missing = new Set<string>();

    const withoutConditionals = body.replace(CONDITIONAL, (_, flag: string, inner: string) => (flags[flag] ? inner : ""));
    const text = withoutConditionals.replace(FIELD, (whole, key: string) => {
        const value = fields[key];
        if (value === undefined) {
            missing.add(key);
            return whole;
        }
        return value;
    });

    return {
        // Trechos condicionais removidos deixam linhas vazias sobrando: no máximo uma linha em branco.
        text: text.replace(/\n{3,}/g, "\n\n").trim() + "\n",
        missing: [...missing],
    };
}

// Palpite do modelo pelo que foi vendido (o dono pode trocar na tela).
export function guessContractKind(itemDescriptions: string[]): ContractKind {
    return itemDescriptions.some((d) => /card[aá]pio|cat[aá]logo/i.test(d)) && !itemDescriptions.some((d) => /site|landing/i.test(d))
        ? "catalog"
        : "site";
}

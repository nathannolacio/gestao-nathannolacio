import * as z from "zod";
import { parseReaisToCents } from "../money.ts";
import { bonusIds } from "../proposal-bonuses.ts";
import { clientSchema, logoUrlSchema } from "./client.ts";
import { proposalItemSchema } from "./proposal-item.ts";

// Campo opcional de formulário: "" (input vazio) e null viram undefined.
// Sem isso, o campo vazio viraria 0 (ou string vazia) em vez de "ausente".
const emptyToUndefined = (value: unknown) =>
    value === "" || value === null ? undefined : value;

// Campos da proposta (tudo menos o cliente), compartilhados por criar e editar.
// Na edição o cliente não vem do navegador: é o que já está gravado.
const proposalFields = {
    title: z
        .string("O título é obrigatório.")
        .trim()
        .min(5, "O título deve ter pelo menos 5 caracteres.")
        .max(100, "O título deve ter no máximo 100 caracteres."),
    deliveryDays: z.coerce
        .number("O prazo deve ser um número.")
        .int("O prazo deve ser um número inteiro de dias.")
        .positive("O prazo deve ser maior que zero."),
    bonuses: z
        .array(z.enum(bonusIds, "Bônus inválido."), "Bônus inválidos.")
        .refine((ids) => new Set(ids).size === ids.length, "Bônus repetido.")
        .default([]),
    items: z
        .array(proposalItemSchema, "Itens inválidos.")
        .min(1, "Adicione pelo menos um item.")
        .max(50, "A proposta pode ter no máximo 50 itens."),
    // Entrada: texto em reais ("79,00"). Saída: centavos (7900).
    // Valor MENSAL; ausente = o cliente tem hospedagem própria.
    hostingMonthly: z.preprocess(
        emptyToUndefined,
        z.coerce
            .string("A hospedagem deve ser um valor em reais.")
            .refine(
                (text) => parseReaisToCents(text) !== null,
                "Informe a hospedagem em reais, por exemplo 79,00.",
            )
            .transform((text) => parseReaisToCents(text) as number)
            .pipe(z.number().positive("A hospedagem deve ser maior que zero."))
            .optional(),
    ),
    // Desconto geral: tipo e valor vêm juntos ou nenhum.
    // Entrada do valor: percentage = inteiro ("10"); fixed = reais ("50,00").
    // A conversão para o formato do banco é feita em `resolveGeneralDiscount`.
    discountType: z.preprocess(
        emptyToUndefined,
        z.enum(["percentage", "fixed"], "Tipo de desconto inválido.").optional(),
    ),
    discountValue: z.preprocess(
        emptyToUndefined,
        z.coerce.string("O desconto deve ser um número.").optional(),
    ),
};

type ResolvedDiscount =
    | { discountType: undefined; discountValue: undefined }
    | { discountType: "percentage" | "fixed"; discountValue: number };

// Valida o par tipo + valor do desconto e converte o valor para o formato do banco.
function resolveGeneralDiscount<
    T extends { discountType?: "percentage" | "fixed"; discountValue?: string },
>(data: T, ctx: z.RefinementCtx): Omit<T, "discountType" | "discountValue"> & ResolvedDiscount {
    const { discountType, discountValue, ...rest } = data;

    if (discountType === undefined && discountValue === undefined) {
        return { ...rest, discountType: undefined, discountValue: undefined };
    }

    if (discountType === undefined || discountValue === undefined) {
        ctx.addIssue({
            code: "custom",
            path: [discountType === undefined ? "discountType" : "discountValue"],
            message: "Informe o tipo e o valor do desconto, ou nenhum dos dois.",
        });
        return z.NEVER;
    }

    let value: number | null;
    if (discountType === "percentage") {
        value = /^\d{1,3}$/.test(discountValue) ? Number(discountValue) : null;
        if (value === null || value < 1 || value > 100) {
            ctx.addIssue({
                code: "custom",
                path: ["discountValue"],
                message: "O desconto percentual deve ser um inteiro de 1 a 100.",
            });
            return z.NEVER;
        }
    } else {
        value = parseReaisToCents(discountValue);
        if (value === null || value <= 0) {
            ctx.addIssue({
                code: "custom",
                path: ["discountValue"],
                message: "Informe o desconto em reais, por exemplo 50,00.",
            });
            return z.NEVER;
        }
    }

    return { ...rest, discountType, discountValue: value };
}

export const proposalSchema = z
    .object({ client: clientSchema, ...proposalFields })
    .transform(resolveGeneralDiscount);

// Edição: sem `client` (não se troca o cliente) e com o id da proposta.
// `logoUrl` (logo do cliente): ausente = não mexe; null = remove; URL = troca.
export const updateProposalSchema = z
    .object({
        id: z.uuid("Proposta inválida."),
        ...proposalFields,
        logoUrl: logoUrlSchema.nullable().optional(),
    })
    .transform(resolveGeneralDiscount);

export type ProposalInput = z.infer<typeof proposalSchema>;

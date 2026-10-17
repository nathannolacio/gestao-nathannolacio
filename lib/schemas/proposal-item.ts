import * as z from "zod";
import { parseReaisToCents } from "../money.ts";
import type { ItemScope, ScopePage } from "../proposal-scope.ts";
import { discountFields, resolveDiscount } from "./discount.ts";

const MAX_SCOPE_PAGES = 10;
const MAX_SCOPE_SECTIONS_PER_PAGE = 20;
const MAX_SCOPE_SECTION_LENGTH = 100;
const MAX_SCOPE_PAGE_NAME_LENGTH = 60;
const MAX_SCOPE_PILLS = 20;

// Lista de pílulas (incluso / não incluso): textos curtos, sem vazio e sem repetição.
const pillList = (label: string) =>
    z
        .array(
            z
                .string(`Texto de "${label}" inválido.`)
                .trim()
                .min(1, `Há uma pílula vazia em "${label}".`)
                .max(MAX_SCOPE_SECTION_LENGTH, `Cada pílula de "${label}" deve ter no máximo ${MAX_SCOPE_SECTION_LENGTH} caracteres.`),
            `"${label}" inválido.`,
        )
        .max(MAX_SCOPE_PILLS, `"${label}" pode ter no máximo ${MAX_SCOPE_PILLS} pílulas.`)
        .refine(
            (items) => new Set(items.map((item) => item.toLowerCase())).size === items.length,
            `Há uma pílula repetida em "${label}".`,
        )
        .default([]);

// Junta os campos de texto do escopo em `scope` (ou null se nada foi preenchido).
// Página inteiramente vazia (sem nome e sem seções) é ignorada.
function resolveItemScope<
    T extends {
        scopePages: { name: string; sections: string }[];
        scopeIncluded: string[];
        scopeNotIncluded: string[];
    },
>(
    data: T,
    ctx: z.RefinementCtx,
): Omit<T, "scopePages" | "scopeIncluded" | "scopeNotIncluded"> & {
    scope: ItemScope | null;
} {
    const { scopePages, scopeIncluded, scopeNotIncluded, ...rest } = data;
    const pages: ScopePage[] = scopePages
        .map((page) => ({
            name: page.name,
            sections: page.sections
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean),
        }))
        .filter((page) => page.name || page.sections.length > 0);

    if (scopeNotIncluded.length === 0 && pages.length === 0 && scopeIncluded.length === 0) {
        return { ...rest, scope: null };
    }

    const fail = (message: string) => {
        ctx.addIssue({ code: "custom", path: ["scopePages"], message });
        return z.NEVER;
    };

    if (pages.length > MAX_SCOPE_PAGES) {
        return fail(`O escopo pode ter no máximo ${MAX_SCOPE_PAGES} páginas.`);
    }
    if (pages.length > 1 && pages.some((page) => !page.name)) {
        return fail("Com mais de uma página, dê um nome a cada uma.");
    }
    if (pages.some((page) => page.sections.length === 0)) {
        return fail("Cada página precisa de ao menos uma seção (uma por linha).");
    }
    if (pages.some((page) => page.sections.length > MAX_SCOPE_SECTIONS_PER_PAGE)) {
        return fail(`Cada página pode ter no máximo ${MAX_SCOPE_SECTIONS_PER_PAGE} seções.`);
    }
    if (pages.some((page) => page.sections.some((s) => s.length > MAX_SCOPE_SECTION_LENGTH))) {
        return fail(`Cada seção deve ter no máximo ${MAX_SCOPE_SECTION_LENGTH} caracteres.`);
    }

    return { ...rest, scope: { pages, included: scopeIncluded, notIncluded: scopeNotIncluded } };
}

export const proposalItemSchema = z
    .object({
        description: z
            .string("A descrição é obrigatória.")
            .trim()
            .min(3, "A descrição deve ter pelo menos 3 caracteres.")
            .max(200, "A descrição deve ter no máximo 200 caracteres."),
        quantity: z.coerce
            .number("A quantidade deve ser um número.")
            .int("A quantidade deve ser um número inteiro.")
            .positive("A quantidade deve ser maior que zero.")
            .max(1000, "A quantidade deve ser no máximo 1000."),
        // Entrada: texto em reais ("1.500,00"). Saída: centavos (150000).
        unitPrice: z
            .string("O valor unitário é obrigatório.")
            .refine(
                (text) => parseReaisToCents(text) !== null,
                "Informe o valor em reais, por exemplo 1.500,00.",
            )
            .transform((text) => parseReaisToCents(text) as number)
            .pipe(z.number().positive("O valor unitário deve ser maior que zero.")),
        ...discountFields,
        // Escopo do item (opcional): tudo texto. Cada página tem nome e as seções (uma por linha).
        scopePages: z
            .array(
                z.object({
                    name: z
                        .string("Nome da página inválido.")
                        .trim()
                        .max(MAX_SCOPE_PAGE_NAME_LENGTH, `O nome da página deve ter no máximo ${MAX_SCOPE_PAGE_NAME_LENGTH} caracteres.`)
                        .default(""),
                    sections: z
                        .string("Seções inválidas.")
                        .max(3000, "Seções longas demais.")
                        .default(""),
                }),
                "Páginas do escopo inválidas.",
            )
            .max(MAX_SCOPE_PAGES, `O escopo pode ter no máximo ${MAX_SCOPE_PAGES} páginas.`)
            .default([]),
        scopeIncluded: pillList("Incluso no site"),
        scopeNotIncluded: pillList("Não incluso"),
    })
    .transform(resolveItemScope)
    .transform(resolveDiscount)
    .superRefine((item, ctx) => {
        // Desconto fixo (centavos) não pode passar do valor bruto do item.
        if (
            item.discountType === "fixed" &&
            item.discountValue > item.quantity * item.unitPrice
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["discountValue"],
                message: "O desconto não pode ser maior que o valor do item.",
            });
        }
    });

export type ProposalItemInput = z.infer<typeof proposalItemSchema>;

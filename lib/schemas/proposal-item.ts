import * as z from "zod";
import { parseReaisToCents } from "../money.ts";
import { discountFields, resolveDiscount } from "./discount.ts";

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
    })
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

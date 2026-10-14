import * as z from "zod";
import { parseReaisToCents } from "../money.ts";

// Campo opcional de formulário: "" (input vazio) e null viram undefined.
export const emptyToUndefined = (value: unknown) =>
    value === "" || value === null ? undefined : value;

// Campos de desconto (tipo + valor em texto), para espalhar num z.object.
export const discountFields = {
    discountType: z.preprocess(
        emptyToUndefined,
        z.enum(["percentage", "fixed"], "Tipo de desconto inválido.").optional(),
    ),
    discountValue: z.preprocess(
        emptyToUndefined,
        z.coerce.string("O desconto deve ser um número.").optional(),
    ),
};

type DiscountInput = {
    discountType?: "percentage" | "fixed" | undefined;
    discountValue?: string | undefined;
};

// Regra do desconto: tipo e valor vêm juntos ou nenhum.
// percentage = inteiro 1 a 100; fixed = reais convertidos para centavos.
// Uso: .transform(resolveDiscount) no fim de um z.object com discountFields.
export function resolveDiscount<T extends DiscountInput>(
    data: T,
    ctx: z.RefinementCtx,
) {
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

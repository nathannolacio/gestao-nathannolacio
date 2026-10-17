import * as z from "zod";

// public_token é gerado com randomBytes(18).toString("base64url") = 24 caracteres.
const token = z.string().regex(/^[A-Za-z0-9_-]{24}$/, "Link inválido.");

// strictObject recusa chaves desconhecidas: é isso que faz `cardInstallments`
// ser PROIBIDO em pix/split (se vier, o parse falha em vez de ser ignorado).
export const approveProposalSchema = z.discriminatedUnion("paymentMethod", [
    z.strictObject({ token, paymentMethod: z.literal("pix") }),
    z.strictObject({ token, paymentMethod: z.literal("split") }),
    z.strictObject({
        token,
        paymentMethod: z.literal("card"),
        cardInstallments: z
            .number("Informe o número de parcelas.")
            .int("O número de parcelas deve ser inteiro.")
            .min(1, "Mínimo de 1 parcela.")
            .max(3, "Máximo de 3 parcelas."),
    }),
]);

export type ApproveProposalInput = z.infer<typeof approveProposalSchema>;

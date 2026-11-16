import * as z from "zod";
import { contractInputDefs, contractKinds, contractPaymentOptions } from "../contracts.ts";

// Texto curto de formulário: só limita o tamanho. O que é obrigatório e o formato de cada campo
// dependem do TIPO de contrato, então essa regra fica em `buildContractFields` (lib/contracts.ts).
const field = z.string().max(300, "Texto longo demais (máximo de 300 caracteres).");

const inputsShape = Object.fromEntries(contractInputDefs.map((def) => [def.key, field])) as Record<
    (typeof contractInputDefs)[number]["key"],
    typeof field
>;

export const generateContractSchema = z.object({
    proposalId: z.uuid("Proposta inválida."),
    kind: z.enum(contractKinds, "Escolha o modelo."),
    inputs: z.object({
        ...inputsShape,
        pagamento: z.enum(contractPaymentOptions, "Forma de pagamento inválida."),
    }),
});

export const contractIdSchema = z.object({ id: z.uuid("Contrato inválido.") });

export const saveContractTemplateSchema = z.object({
    kind: z.enum(contractKinds, "Modelo inválido."),
    body: z
        .string()
        .trim()
        .min(200, "O modelo está curto demais para ser um contrato.")
        .max(60_000, "O modelo passou do tamanho máximo (60 mil caracteres)."),
});

export const contractKindSchema = z.object({ kind: z.enum(contractKinds, "Modelo inválido.") });

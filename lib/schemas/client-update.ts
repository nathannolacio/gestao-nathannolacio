import * as z from "zod";
import { isValidCnpj, isValidCpf } from "../document.ts";
import { logoUrlSchema } from "./client.ts";

const UFS = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
    "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

// Texto opcional de formulário: tira espaços das pontas e "" vira null (limpa a coluna).
function optionalText(label: string, max: number) {
    return z.preprocess(
        (value) => (typeof value === "string" ? value.trim() || null : value),
        z.string().max(max, `${label} deve ter no máximo ${max} caracteres.`).nullable(),
    );
}

// Número opcional (CPF, CEP...): aceita pontuação, guarda só os dígitos. "" vira null.
function optionalDigits(label: string, length: number) {
    return z.preprocess(
        (value) => {
            if (typeof value !== "string") return value;
            const digits = value.replace(/\D/g, "");
            return digits === "" ? null : digits;
        },
        z.string().regex(new RegExp(`^\\d{${length}}$`), `${label} deve ter ${length} dígitos.`).nullable(),
    );
}

export const updateClientSchema = z
    .object({
        id: z.uuid("Cliente inválido."),
        type: z.enum(["PF", "PJ"], "Selecione o tipo do cliente (PF ou PJ)."),
        name: z
            .string("O nome é obrigatório.")
            .trim()
            .min(3, "O nome deve ter pelo menos 3 caracteres.")
            .max(100, "O nome deve ter no máximo 100 caracteres."),
        legalName: optionalText("O nome completo", 150),
        email: z.preprocess(
            (value) => (typeof value === "string" ? value.trim() || null : value),
            z
                .email("Informe um e-mail válido.")
                .max(256, "O e-mail deve ter no máximo 256 caracteres.")
                .nullable(),
        ),
        // WhatsApp = telefone já usado nas propostas (55 + DDD + número).
        phone: z
            .string("O WhatsApp é obrigatório.")
            .transform((p) => p.replace(/\D/g, ""))
            .pipe(z.string().regex(/^\d{12,13}$/, "O WhatsApp deve ter 12 ou 13 dígitos (55 + DDD + número).")),
        // CPF ou CNPJ; o dígito verificador é conferido no superRefine, conforme o tipo.
        document: z.preprocess(
            (value) => {
                if (typeof value !== "string") return value;
                const digits = value.replace(/\D/g, "");
                return digits === "" ? null : digits;
            },
            z.string().regex(/^(\d{11}|\d{14})$/, "Informe um CPF (11) ou CNPJ (14 dígitos).").nullable(),
        ),
        zipCode: optionalDigits("O CEP", 8),
        street: optionalText("A rua", 150),
        addressNumber: optionalText("O número", 20),
        addressComplement: optionalText("O complemento", 100),
        neighborhood: optionalText("O bairro", 100),
        city: optionalText("A cidade", 100),
        state: z.preprocess(
            (value) => (typeof value === "string" ? value.trim().toUpperCase() || null : value),
            z.enum(UFS, "Informe a sigla do estado (ex.: SP).").nullable(),
        ),
        legalRepName: optionalText("O nome do responsável", 100),
        legalRepDocument: optionalDigits("O CPF do responsável", 11),
        legalRepRole: optionalText("O cargo", 100),
        // Ausente = não mexe; null = remove; URL = troca.
        logoUrl: logoUrlSchema.nullable().optional(),
    })
    .superRefine((data, ctx) => {
        // Documento conforme o tipo: CPF (11) para PF, CNPJ (14) para PJ.
        if (data.document !== null) {
            const valid = data.type === "PF" ? isValidCpf(data.document) : isValidCnpj(data.document);
            if (!valid) {
                ctx.addIssue({
                    code: "custom",
                    path: ["document"],
                    message: data.type === "PF" ? "CPF inválido." : "CNPJ inválido.",
                });
            }
        }
        if (data.legalRepDocument !== null && !isValidCpf(data.legalRepDocument)) {
            ctx.addIssue({
                code: "custom",
                path: ["legalRepDocument"],
                message: "CPF do responsável inválido.",
            });
        }
    })
    .transform((data) =>
        // Responsável legal só existe em PJ: em PF os campos são zerados.
        data.type === "PF"
            ? { ...data, legalRepName: null, legalRepDocument: null, legalRepRole: null }
            : data,
    );

export type UpdateClientInput = z.infer<typeof updateClientSchema>;

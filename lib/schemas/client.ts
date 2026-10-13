import * as z from "zod";

 const newClient = z.object({
    clientMode: z.literal("new"),
    name: z
        .string("O nome é obrigatório.")
        .trim()
        .min(3, "O nome deve ter pelo menos 3 caracteres.")
        .max(100, "O nome deve ter no máximo 100 caracteres."),
    email: z
        .email("Informe um e-mail válido.")
        .max(256, "O e-mail deve ter no máximo 256 caracteres."),
    phone: z
        .string("O telefone é obrigatório.")
        .transform((p) => p.replace(/\D/g, ""))
        .pipe(
            z.string().regex(/^\d{13}$/, "O telefone deve ter 13 dígitos (55 + DDD + número)."),
        ),
    type: z.enum(["PF", "PJ"], "Selecione o tipo do cliente (PF ou PJ).")
 });

 const existingClient = z.object({
    clientMode: z.literal("existing"),
    clientId: z.uuid("Selecione um cliente válido."),
 });

 export const clientSchema = z.discriminatedUnion("clientMode", [newClient, existingClient]);
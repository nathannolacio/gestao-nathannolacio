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
    type: z.enum(["PF", "PJ"], "Selecione o tipo do cliente (PF ou PJ)."),
    // O navegador manda uma URL, então só aceitamos a do NOSSO Blob (https, host
    // *.public.blob.vercel-storage.com, pasta logos/). Qualquer outra seria
    // carregada na página pública do cliente.
    logoUrl: z
        .url({
            protocol: /^https$/,
            hostname: /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/,
            error: "Logo inválida. Envie o arquivo novamente.",
        })
        .max(500)
        .refine((url) => new URL(url).pathname.startsWith("/logos/"), "Logo inválida. Envie o arquivo novamente.")
        .optional(),
 });

 const existingClient = z.object({
    clientMode: z.literal("existing"),
    clientId: z.uuid("Selecione um cliente válido."),
 });

 export const clientSchema = z.discriminatedUnion("clientMode", [newClient, existingClient]);
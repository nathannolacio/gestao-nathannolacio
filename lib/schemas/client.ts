import * as z from "zod";

// O navegador manda uma URL, então só aceitamos a do NOSSO Blob (https, host
// *.public.blob.vercel-storage.com, pasta logos/). Qualquer outra seria
// carregada na página pública do cliente.
export const logoUrlSchema = z
    .url({
        protocol: /^https$/,
        hostname: /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/,
        error: "Logo inválida. Envie o arquivo novamente.",
    })
    .max(500)
    .refine((url) => new URL(url).pathname.startsWith("/logos/"), "Logo inválida. Envie o arquivo novamente.");

 const newClient = z.object({
    clientMode: z.literal("new"),
    name: z
        .string("O nome é obrigatório.")
        .trim()
        .min(3, "O nome deve ter pelo menos 3 caracteres.")
        .max(100, "O nome deve ter no máximo 100 caracteres."),
    // Opcional: o e-mail é pedido só depois da aprovação, para enviar o contrato.
    // Vazio (ou só espaços) vira ausente, nunca string vazia.
    email: z.preprocess(
        (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
        z
            .email("Informe um e-mail válido.")
            .max(256, "O e-mail deve ter no máximo 256 caracteres.")
            .optional(),
    ),
    phone: z
        .string("O telefone é obrigatório.")
        .transform((p) => p.replace(/\D/g, ""))
        .pipe(
            z.string().regex(/^\d{12,13}$/, "O telefone deve ter 12 ou 13 dígitos (55 + DDD + número)."),
        ),
    type: z.enum(["PF", "PJ"], "Selecione o tipo do cliente (PF ou PJ)."),
    logoUrl: logoUrlSchema.optional(),
 });

 const existingClient = z.object({
    clientMode: z.literal("existing"),
    clientId: z.uuid("Selecione um cliente válido."),
 });

 export const clientSchema = z.discriminatedUnion("clientMode", [newClient, existingClient]);
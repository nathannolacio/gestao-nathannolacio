"use server";

import { randomBytes } from "node:crypto";
import { put } from "@vercel/blob";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { detectLogoType, MAX_LOGO_BYTES } from "@/lib/logo-file";

const logoFileSchema = z.object({
    logo: z
        .instanceof(File, { error: "Selecione um arquivo." })
        .refine((file) => file.size > 0, "O arquivo está vazio.")
        .refine((file) => file.size <= MAX_LOGO_BYTES, "A logo deve ter no máximo 2 MB."),
});

// Recebe FormData (arquivo não cabe em objeto JSON) e devolve a URL pública.
// A URL é gravada depois, junto do cliente, pela action que cria a proposta.
export async function uploadClientLogo(formData: FormData) {
    await requireUser();

    const parsed = logoFileSchema.safeParse({ logo: formData.get("logo") });
    if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0].message } as const;
    }
    const { logo } = parsed.data;

    // O tipo vem dos bytes do arquivo, não do nome nem do `type` do navegador.
    const type = detectLogoType(new Uint8Array(await logo.arrayBuffer()));
    if (!type) {
        return { ok: false, error: "Use uma imagem PNG, JPG ou WebP." } as const;
    }

    // Nome gerado por nós: nunca usamos o nome que veio do navegador.
    const pathname = `logos/${randomBytes(16).toString("hex")}.${type.ext}`;

    try {
        const blob = await put(pathname, logo, {
            access: "public",
            contentType: type.contentType,
        });
        return { ok: true, url: blob.url } as const;
    } catch {
        return { ok: false, error: "Não foi possível enviar a logo. Tente novamente." } as const;
    }
}

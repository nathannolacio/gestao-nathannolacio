"use server";

import { randomBytes } from "node:crypto";
import { put } from "@vercel/blob";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { updateClientSchema } from "@/lib/schemas/client-update";
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

// Edita os dados do cliente (inclui os do contrato e a logo). Cliente arquivado não edita.
// Vale para todas as propostas dele, inclusive as já enviadas.
export async function updateClient(input: unknown) {
    await requireUser();

    const result = updateClientSchema.safeParse(input);

    if (!result.success) {
        const { fieldErrors } = z.flattenError(result.error);

        return { ok: false as const, fieldErrors, formError: null };
    }

    const { id, phone, logoUrl, ...data } = result.data;

    const rows = await db
        .update(clients)
        .set({
            ...data,
            phoneNumber: phone,
            // undefined = não mexe na logo; null = remove.
            ...(logoUrl !== undefined && { logoUrl }),
        })
        .where(and(eq(clients.id, id), isNull(clients.deletedAt)))
        .returning({ id: clients.id });

    if (rows.length === 0) {
        return { ok: false as const, fieldErrors: {}, formError: "Cliente não encontrado." };
    }

    revalidatePath("/clientes");
    revalidatePath("/propostas");

    return { ok: true as const };
}

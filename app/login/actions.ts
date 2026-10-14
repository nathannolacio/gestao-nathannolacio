"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/better-auth";
import { loginSchema, safeNext } from "@/lib/schemas/login";

// Action PÚBLICA por natureza (quem chama ainda não tem login). A proteção é a
// credencial + o limite de tentativas do Better Auth. Zod valida o formato antes.
export async function login(input: unknown) {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) {
        return { ok: false, error: "Informe e-mail e senha válidos." } as const;
    }

    const { email, password, next } = parsed.data;

    try {
        // nextCookies() grava o cookie de sessão na resposta desta action.
        await auth.api.signInEmail({
            body: { email, password },
            headers: await headers(),
        });
    } catch {
        // Mensagem única: não revela se o e-mail existe.
        return { ok: false, error: "E-mail ou senha incorretos." } as const;
    }

    // redirect() lança uma exceção interna do Next; fica FORA do try/catch.
    redirect(safeNext(next));
}

export async function logout() {
    await auth.api.signOut({ headers: await headers() });
    redirect("/login");
}

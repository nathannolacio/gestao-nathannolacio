import { headers } from "next/headers";
import { auth } from "./better-auth";

// Lê a sessão pelo cookie da requisição atual. Devolve o usuário ou null.
// Para páginas que mudam de comportamento conforme o login (ex.: preview de
// rascunho na página pública).
export async function getOptionalUser() {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user ?? null;
}

// Para Server Actions e páginas do admin: sem sessão válida, lança erro.
// Toda Server Action chama isto primeiro (o proxy protege páginas, mas não
// substitui esta checagem: a action é um endpoint acessível pela rede).
export async function requireUser() {
    const user = await getOptionalUser();
    if (!user) {
        throw new Error("Não autenticado");
    }
    return user;
}

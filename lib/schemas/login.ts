import { z } from "zod";

// Só formato: a senha NÃO tem regra de tamanho aqui de propósito. Quem valida a
// credencial é o Better Auth; regras no login só entregariam dicas a um atacante.
export const loginSchema = z.object({
    email: z.email().max(256),
    password: z.string().min(1).max(128),
    next: z.string().max(500).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

const DEFAULT_REDIRECT = "/propostas";

// Não vale voltar para o login (loop) nem para a API.
const BLOCKED = /^\/(login|api)(\/|$)/;

// Evita open redirect: só aceita caminho interno do sistema. Recusa URL absoluta
// ("https://..."), protocol-relative ("//site.com") e barra invertida ("/\site.com"),
// que alguns navegadores tratam como "//".
export function safeNext(next: string | undefined): string {
    if (!next) return DEFAULT_REDIRECT;
    if (!/^\/[A-Za-z0-9\-._~%/]*$/.test(next)) return DEFAULT_REDIRECT;
    if (next.includes("//")) return DEFAULT_REDIRECT;
    if (BLOCKED.test(next)) return DEFAULT_REDIRECT;
    return next;
}

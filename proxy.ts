import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// Barreira RÁPIDA: só olha se o cookie de sessão existe (não consulta o banco).
// A validação real é feita por requireUser() nas actions e nas leituras privadas;
// um cookie forjado passa por aqui, mas não passa de lá.
export function proxy(request: NextRequest) {
    if (!getSessionCookie(request)) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("next", request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
}

// Seguro por padrão: TUDO é protegido, exceto a lista abaixo (as únicas rotas públicas).
// Uma rota nova já nasce protegida; para abrir uma, é preciso adicioná-la aqui de propósito.
//  - proposta/  página pública do cliente (e a action de aprovar, que roda nela)
//  - login      tela de login (sem isso, o redirecionamento entraria em loop)
//  - api/auth/  handler do Better Auth
//  - _next/     arquivos internos do Next
//  - *.ext      arquivos estáticos de public/ (imagens, favicon...)
// Atenção: dentro da string, o ponto escapado é "\\." (a barra dupla vira uma barra no regex);
// com "\." o TypeScript descarta a barra e o padrão deixa de proteger as rotas.
// Atenção: "proposta/" tem a barra de propósito, para NÃO liberar /propostas (a lista privada).
export const config = {
    matcher: ["/((?!proposta/|login$|login/|api/auth/|_next/|.*\\..*).*)"],
};

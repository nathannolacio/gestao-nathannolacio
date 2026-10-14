import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// Barreira RÁPIDA: só olha se o cookie de sessão existe (não consulta o banco).
// A validação real é feita por requireUser() nas actions e nas leituras do admin;
// um cookie forjado passa por aqui, mas não passa de lá.
export function proxy(request: NextRequest) {
    if (!getSessionCookie(request)) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("next", request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
}

// Só o admin. A página pública (/proposta/...), a action de aprovar e
// /api/auth ficam de fora de propósito.
export const config = {
    matcher: ["/admin/:path*"],
};

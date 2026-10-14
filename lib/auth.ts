// Igual a requireUser, mas devolve null em vez de lançar erro quando não há
// usuário logado. Para páginas que mudam de comportamento conforme o login
// (ex.: preview de rascunho na página pública).
export async function getOptionalUser() {
    // TODO (Etapa 8): ler a sessão do Better Auth. Até lá, ninguém é "logado"
    // para a página pública: rascunho dá 404 para todos.
    return null;
}

export async function requireUser() {

    // TODO (Etapa 8): provisório. Trocar o corpo por a sessão do Better Auth
    // e lançar erro se não houver usuário logado. Não deployar assim.

    const id = "dev-user";
    const name = "Nathan Nolacio"
    const email = "nathannolacio04@gmail.com"

    return { id, name, email }
}
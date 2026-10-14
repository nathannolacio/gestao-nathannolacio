export async function requireUser() {

    // TODO (Etapa 8): provisório. Trocar o corpo por a sessão do Better Auth
    // e lançar erro se não houver usuário logado. Não deployar assim.

    const id = "dev-user";
    const name = "Nathan Nolacio"
    const email = "nathannolacio04@gmail.com"

    return { id, name, email }
}
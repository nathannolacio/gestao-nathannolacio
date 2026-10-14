// Cria o ÚNICO usuário do sistema (o cadastro pela rede está desligado).
// Uso (PowerShell):
//   $env:ADMIN_EMAIL="voce@email.com"; $env:ADMIN_NAME="Seu Nome"; $env:ADMIN_PASSWORD="..."
//   node --env-file=.env.local db/create-user.ts
// A senha vem de variável de ambiente para não ficar no código nem no git.
import { auth } from "../lib/better-auth.ts";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const name = process.env.ADMIN_NAME?.trim();
const password = process.env.ADMIN_PASSWORD;

if (!email || !name || !password) {
    throw new Error("Defina ADMIN_EMAIL, ADMIN_NAME e ADMIN_PASSWORD");
}
if (password.length < 12) {
    throw new Error("Use uma senha com pelo menos 12 caracteres");
}

// auth.api.signUpEmail respeitaria o disableSignUp e recusaria. Por isso usamos
// o contexto interno: o mesmo hash de senha e o mesmo adaptador que o login usa.
const ctx = await auth.$context;

if (await ctx.internalAdapter.findUserByEmail(email)) {
    throw new Error("Já existe um usuário com esse e-mail");
}

const hash = await ctx.password.hash(password);
const user = await ctx.internalAdapter.createUser({ email, name, emailVerified: true }, { method: "admin" });
await ctx.internalAdapter.linkAccount({
    userId: user.id,
    providerId: "credential",
    accountId: user.id,
    password: hash,
});

console.log(`Usuário criado: ${user.email}`);
process.exit(0);

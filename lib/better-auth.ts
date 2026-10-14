import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "../db/index.ts";
import * as authSchema from "../db/auth-schema.ts";

export const auth = betterAuth({
    database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
    emailAndPassword: {
        enabled: true,
        // Uso individual: ninguém se cadastra pela rede. O usuário é criado por script.
        disableSignUp: true,
    },
    // Precisa ser o ÚLTIMO plugin: grava o cookie de sessão quando o login
    // acontece dentro de uma Server Action.
    plugins: [nextCookies()],
});

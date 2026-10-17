import { existsSync } from 'node:fs';
import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Migrations na PRODUÇÃO (branch `production` do Neon). Lê as URLs de `.env.production.local`
// (ignorado pelo git) em vez do `.env.local` (dev). Uso: `npm run db:migrate:prod`.
const envFile = '.env.production.local';

if (!existsSync(envFile)) {
    throw new Error(
        `Arquivo '${envFile}' não encontrado. Crie com DATABASE_URL_UNPOOLED (e DATABASE_URL) da branch 'production' do Neon.`,
    );
}

config({ path: envFile });

// Igual ao drizzle.config.ts: conexão DIRETA (sem pooler) quando existir.
const databaseUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error(`Nenhuma variável 'DATABASE_URL_UNPOOLED' ou 'DATABASE_URL' em '${envFile}'`);
}

// Mostra o destino para conferir que é mesmo a produção antes de aplicar.
console.log(`[PRODUÇÃO] banco alvo: ${new URL(databaseUrl).host}`);

export default defineConfig({
    out: './drizzle',
    schema: ['./db/schema.ts', './db/auth-schema.ts'],
    dialect: 'postgresql',
    dbCredentials: {
        url: databaseUrl,
    },
});

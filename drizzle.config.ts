import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local' });

// Migrations usam a conexão DIRETA (sem pooler) quando existir; o app em runtime
// continua com DATABASE_URL (pooled) em db/index.ts.
const databaseUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error("Nenhuma variável 'DATABASE_URL_UNPOOLED' ou 'DATABASE_URL' foi definida");
}

export default defineConfig({
    out: './drizzle',
    schema: ['./db/schema.ts', './db/auth-schema.ts'],
    dialect: 'postgresql',
    dbCredentials: {
        url: databaseUrl,
    },
});
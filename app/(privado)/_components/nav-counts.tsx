import { connection } from "next/server";
import { and, count, eq, inArray, isNull, lte } from "drizzle-orm";
import { db } from "@/db";
import { leads, proposals } from "@/db/schema";
import { openLeadStages, todayInSaoPaulo } from "@/lib/leads";

// Contadores do menu: quanto trabalho espera em cada tela. Lidos no servidor, por
// requisição (por isso `connection()` e o <Suspense> em volta, no NavLink).
// Zero não aparece, para o menu só chamar atenção quando há algo a fazer.

function Count({ value, tone = "muted" }: { value: number; tone?: "muted" | "attention" }) {
    if (value === 0) return null;
    return (
        <span
            className={`ml-auto rounded-full px-1.5 py-px text-[11px] leading-4 font-medium tabular-nums ${
                tone === "attention" ? "bg-dourado/15 text-dourado" : "bg-admin-raised text-admin-muted"
            }`}
        >
            {value}
        </span>
    );
}

// Hoje: follow-ups vencidos ou marcados para hoje.
export async function DueFollowUpsCount() {
    await connection();
    const [row] = await db
        .select({ value: count() })
        .from(leads)
        .where(
            and(
                isNull(leads.deletedAt),
                inArray(leads.stage, [...openLeadStages]),
                lte(leads.nextFollowUpAt, todayInSaoPaulo()),
            ),
        );
    return <Count value={row?.value ?? 0} tone="attention" />;
}

// Leads: novos ainda não abordados.
export async function NewLeadsCount() {
    await connection();
    const [row] = await db
        .select({ value: count() })
        .from(leads)
        .where(and(isNull(leads.deletedAt), eq(leads.stage, "new")));
    return <Count value={row?.value ?? 0} />;
}

// Propostas: enviadas esperando resposta do cliente.
export async function WaitingProposalsCount() {
    await connection();
    const [row] = await db
        .select({ value: count() })
        .from(proposals)
        .where(and(isNull(proposals.deletedAt), eq(proposals.status, "sent")));
    return <Count value={row?.value ?? 0} />;
}

import { Suspense } from "react";
import { connection } from "next/server";
import * as z from "zod";
import { db } from "@/db";
import { ProposalForm, type LeadPrefill } from "../_components/proposal-form";

// `?lead=<id>`: proposta criada a partir da ficha do lead (jornada comercial).
type NovaPropostaProps = { searchParams: Promise<{ lead?: string }> };

export default function NovaProposta({ searchParams }: NovaPropostaProps) {
    return (
        <>
            <h1 className="font-display text-2xl font-medium tracking-tight">
                Nova proposta
            </h1>

            <div className="mt-6">
                <Suspense fallback={<FormSkeleton />}>
                    <FormularioComClientes searchParams={searchParams} />
                </Suspense>
            </div>
        </>
    );
}

async function FormularioComClientes({ searchParams }: NovaPropostaProps) {
    await connection();
    const { lead: leadParam } = await searchParams;
    const leadId = z.uuid().safeParse(leadParam).success ? leadParam! : null;

    const lead: LeadPrefill | null = leadId
        ? ((await db.query.leads.findFirst({
              where: { id: leadId, deletedAt: { isNull: true } },
              columns: { id: true, businessName: true, phoneNumber: true, clientId: true },
          })) ?? null)
        : null;

    const clientes = await db.query.clients.findMany({
        columns: {
            id: true,
            name: true,
        },
        where: {
            deletedAt: {
                isNull: true,
            },
        },
        orderBy: {
            name: "asc",
        },
    });

    return <ProposalForm mode="create" clients={clientes} lead={lead} />;
}

function FormSkeleton() {
    return (
        <div aria-hidden="true" className="space-y-4">
            {[0, 1, 2].map((campo) => (
                <div key={campo} className="h-10 w-full max-w-md animate-pulse rounded bg-admin-raised" />
            ))}
        </div>
    );
}

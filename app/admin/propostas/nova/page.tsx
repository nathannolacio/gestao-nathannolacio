import { Suspense } from "react";
import { connection } from "next/server";
import { db } from "@/db";
import { ProposalForm } from "../_components/proposal-form";

export default function NovaProposta() {
    return (
        <>
            <h1 className="font-display text-2xl font-medium tracking-tight">
                Nova proposta
            </h1>

            <div className="mt-6">
                <Suspense fallback={<FormSkeleton />}>
                    <FormularioComClientes />
                </Suspense>
            </div>
        </>
    );
}

async function FormularioComClientes() {
    await connection();
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

    return <ProposalForm mode="create" clients={clientes} />;
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

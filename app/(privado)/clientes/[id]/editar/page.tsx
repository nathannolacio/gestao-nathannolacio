import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import * as z from "zod";
import { db } from "@/db";
import { ClientForm } from "../../_components/client-form";

type EditarClienteProps = {
    params: Promise<{ id: string }>;
};

// A página só repassa a promessa; o `await` fica dentro do Suspense (cacheComponents).
export default function EditarCliente({ params }: EditarClienteProps) {
    return (
        <>
            <Link href="/clientes" className="text-sm text-admin-muted hover:text-admin-text">
                ← Clientes
            </Link>
            <h1 className="mt-2 font-display text-2xl font-medium tracking-tight">Editar cliente</h1>

            <div className="mt-6">
                <Suspense fallback={<FormSkeleton />}>
                    <FormularioDoCliente params={params} />
                </Suspense>
            </div>
        </>
    );
}

async function FormularioDoCliente({ params }: EditarClienteProps) {
    await connection();
    const { id } = await params;

    // O id vem da URL: valida antes de consultar (um texto qualquer quebraria o cast para uuid).
    if (!z.uuid().safeParse(id).success) notFound();

    const client = await db.query.clients.findFirst({
        where: { id, deletedAt: { isNull: true } },
    });

    if (!client) notFound();

    return (
        <ClientForm
            clientId={client.id}
            initialLogoUrl={client.logoUrl}
            initialValues={{
                type: client.type,
                name: client.name,
                legalName: client.legalName ?? "",
                email: client.email ?? "",
                phone: client.phoneNumber,
                document: client.document ?? "",
                zipCode: client.zipCode ?? "",
                street: client.street ?? "",
                addressNumber: client.addressNumber ?? "",
                addressComplement: client.addressComplement ?? "",
                neighborhood: client.neighborhood ?? "",
                city: client.city ?? "",
                state: client.state ?? "",
                legalRepName: client.legalRepName ?? "",
                legalRepDocument: client.legalRepDocument ?? "",
                legalRepRole: client.legalRepRole ?? "",
            }}
        />
    );
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

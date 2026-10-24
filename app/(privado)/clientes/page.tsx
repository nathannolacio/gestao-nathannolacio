import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { db } from "@/db";
import { formatDocument } from "@/lib/document";
import { missingContractFields } from "@/lib/client-contract";

export default function Clientes() {
    return (
        <>
            <h1 className="font-display text-2xl font-medium tracking-tight">Clientes</h1>

            <div className="mt-6">
                <Suspense fallback={<ListaSkeleton />}>
                    <ListaClientes />
                </Suspense>
            </div>
        </>
    );
}

async function ListaClientes() {
    await connection();
    const clientes = await db.query.clients.findMany({
        where: { deletedAt: { isNull: true } },
        orderBy: { createdAt: "desc" },
    });

    if (clientes.length === 0) {
        return (
            <div className="rounded-xl border border-admin-line px-6 py-12 text-center">
                <p className="text-admin-text">Nenhum cliente ainda.</p>
                <p className="mt-1 text-sm text-admin-muted">
                    Os clientes cadastrados ao criar propostas aparecem aqui.
                </p>
            </div>
        );
    }

    return (
        <ul className="divide-y divide-admin-line overflow-hidden rounded-xl border border-admin-line">
            {clientes.map((cliente) => {
                const missing = missingContractFields(cliente);

                return (
                    <li key={cliente.id}>
                        <Link
                            href={`/clientes/${cliente.id}/editar`}
                            className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 transition-colors duration-150 hover:bg-admin-raised/50"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="font-medium text-admin-text wrap-break-word">
                                    {cliente.name}
                                    <span className="ml-2 text-xs font-normal text-admin-muted">
                                        {cliente.type}
                                    </span>
                                </p>
                                <p className="mt-0.5 text-sm text-admin-muted wrap-break-word">
                                    {[formatDocument(cliente.document), cliente.email]
                                        .filter(Boolean)
                                        .join(" · ") || "Sem documento nem e-mail"}
                                </p>
                            </div>

                            <span
                                className={`rounded-full border px-2.5 py-1 text-xs ${
                                    missing.length === 0
                                        ? "border-dourado/50 text-dourado"
                                        : "border-admin-line text-admin-muted"
                                }`}
                                title={missing.length > 0 ? `Falta: ${missing.join(", ")}` : undefined}
                            >
                                {missing.length === 0
                                    ? "Pronto para contrato"
                                    : `Contrato: faltam ${missing.length}`}
                            </span>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}

function ListaSkeleton() {
    return (
        <div aria-hidden="true" className="divide-y divide-admin-line overflow-hidden rounded-xl border border-admin-line">
            {[0, 1, 2].map((linha) => (
                <div key={linha} className="flex items-center gap-4 px-4 py-4">
                    <div className="h-3 w-48 animate-pulse rounded bg-admin-raised" />
                    <div className="ml-auto h-3 w-20 animate-pulse rounded bg-admin-raised" />
                </div>
            ))}
        </div>
    );
}

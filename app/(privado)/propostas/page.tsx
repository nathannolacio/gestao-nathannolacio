import Link from "next/link";
import { db } from "@/db";
import { Suspense } from "react";
import { StatusBadge } from "./_components/status-badge";
import { ProposalActions } from "./_components/proposal-actions";
import { connection } from "next/server";
import { PageHeader, buttonPrimary } from "../_components/page-header";
import { formatBRL, totalFromRows } from "@/lib/proposal-calc";

export default function Propostas() {

    return (
        <>
            <PageHeader
                title="Propostas"
                description="Rascunhos, enviadas e aprovadas. O cliente vê a proposta pelo link, ao vivo."
                actions={
                    <Link href="/propostas/nova" className={buttonPrimary}>
                        Nova proposta
                    </Link>
                }
            />

            <div className="mt-6">
                <Suspense fallback={<ListaSkeleton />}>
                    <ListaPropostas />
                </Suspense>
            </div>
        </>
    );
}

async function ListaPropostas() {
    await connection();
    const propostas = await db.query.proposals.findMany({
        where: {
            deletedAt: {
                isNull: true
            }
        },
        with: {
            client: true,
            items: true,
        },
        orderBy: {
            createdAt: "desc",
        }
    })

    if (propostas.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center">
                <p className="text-admin-text">Nenhuma proposta ainda.</p>
                <p className="mt-1 text-sm text-admin-muted">
                    As propostas criadas aparecem aqui.
                </p>
            </div>
        );
    }

    return (
        <div className="admin-card overflow-hidden">
            {/* Abaixo de md a tabela vira lista de cartões (grid 2 colunas por linha). */}
            <table className="w-full text-left text-sm max-md:block">
                <thead className="max-md:hidden">
                    <tr className="border-b border-admin-line text-xs text-admin-muted">
                        <th scope="col" className="px-4 py-3 font-medium">Proposta</th>
                        <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">Cliente</th>
                        <th scope="col" className="px-4 py-3 text-right font-medium">Total</th>
                        <th scope="col" className="px-4 py-3 font-medium">Status</th>
                        <th scope="col" className="hidden px-4 py-3 text-right font-medium sm:table-cell">Criada em</th>
                        <th scope="col" className="px-4 py-3 text-right font-medium">
                            <span className="sr-only">Ações</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-admin-line max-md:block">
                    {propostas.map((proposta) => (
                        <tr
                            key={proposta.id}
                            className="transition-colors duration-150 hover:bg-admin-raised/50 max-md:grid max-md:grid-cols-[minmax(0,1fr)_auto] max-md:items-center max-md:gap-x-3 max-md:gap-y-3 max-md:px-4 max-md:py-4"
                        >
                            <td className="px-4 py-3.5 max-md:col-start-1 max-md:row-start-1 max-md:p-0">
                                <Link
                                    href={`/propostas/${proposta.id}`}
                                    className="font-medium text-admin-text transition-colors hover:text-dourado max-md:wrap-break-word"
                                >
                                    {proposta.title}
                                </Link>
                                <p className="mt-0.5 text-admin-muted md:hidden">{proposta.client?.name}</p>
                            </td>
                            <td className="hidden px-4 py-3.5 text-admin-muted md:table-cell">
                                {proposta.client?.name}
                            </td>
                            <td className="px-4 py-3.5 text-right tabular-nums text-admin-text max-md:col-start-1 max-md:row-start-2 max-md:p-0 max-md:text-left">
                                {formatBRL(totalFromRows(proposta))}
                            </td>
                            <td className="px-4 py-3.5 max-md:col-start-2 max-md:row-start-1 max-md:justify-self-end max-md:p-0">
                                <StatusBadge status={proposta.status} />
                            </td>
                            <td className="hidden px-4 py-3.5 text-right tabular-nums text-admin-muted md:table-cell">
                                {proposta.createdAt.toLocaleDateString("pt-BR")}
                            </td>
                            <td className="px-4 py-3.5 max-md:col-start-2 max-md:row-start-2 max-md:p-0">
                                <ProposalActions
                                    id={proposta.id}
                                    publicToken={proposta.publicToken}
                                    status={proposta.status}
                                    showDevRevert={process.env.NODE_ENV !== "production"}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ListaSkeleton() {
    return (
        <div aria-hidden="true" className="admin-card divide-y divide-white/[0.05] overflow-hidden">
            {[0, 1, 2].map((linha) => (
                <div key={linha} className="flex items-center gap-4 px-4 py-4">
                    <div className="h-3 w-48 animate-pulse rounded bg-admin-raised" />
                    <div className="ml-auto h-3 w-20 animate-pulse rounded bg-admin-raised" />
                </div>
            ))}
        </div>
    );
}

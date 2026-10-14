import Link from "next/link";
import { db } from "@/db";
import { Suspense } from "react";
import { StatusBadge } from "./_components/status-badge";
import { ProposalActions } from "./_components/proposal-actions";
import { connection } from "next/server";
import {
    formatBRL,
    projectTotal,
    toDiscount,
    type DiscountType,
} from "@/lib/proposal-calc";

export default function Propostas() {

    return (
        <>
            <div className="flex items-center justify-between gap-4">
                <h1 className="font-display text-2xl font-medium tracking-tight">
                    Propostas
                </h1>
                <Link
                    href="/admin/propostas/nova"
                    className="rounded-lg bg-dourado px-4 py-2 text-sm font-medium text-grafite transition-opacity duration-150 hover:opacity-90"
                >
                    Nova proposta
                </Link>
            </div>

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
            <div className="rounded-xl border border-admin-line px-6 py-12 text-center">
                <p className="text-admin-text">Nenhuma proposta ainda.</p>
                <p className="mt-1 text-sm text-admin-muted">
                    As propostas criadas aparecem aqui.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-admin-line">
            <table className="w-full text-left text-sm">
                <thead>
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
                <tbody className="divide-y divide-admin-line">
                    {propostas.map((proposta) => (
                        <tr key={proposta.id} className="transition-colors duration-150 hover:bg-admin-raised/50">
                            <td className="px-4 py-3.5">
                                <p className="font-medium text-admin-text">{proposta.title}</p>
                                <p className="mt-0.5 text-admin-muted md:hidden">{proposta.client?.name}</p>
                            </td>
                            <td className="hidden px-4 py-3.5 text-admin-muted md:table-cell">
                                {proposta.client?.name}
                            </td>
                            <td className="px-4 py-3.5 text-right tabular-nums text-admin-text">
                                {formatBRL(totalDaProposta(proposta))}
                            </td>
                            <td className="px-4 py-3.5">
                                <StatusBadge status={proposta.status} />
                            </td>
                            <td className="hidden px-4 py-3.5 text-right tabular-nums text-admin-muted sm:table-cell">
                                {proposta.createdAt.toLocaleDateString("pt-BR")}
                            </td>
                            <td className="px-4 py-3.5">
                                <div className="flex items-start justify-end gap-2">
                                    <ProposalActions
                                        id={proposta.id}
                                        status={proposta.status}
                                        showDevRevert={process.env.NODE_ENV !== "production"}
                                    />
                                    <Link
                                        href={`/proposta/${proposta.publicToken}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-lg border border-admin-line px-3 py-1.5 text-xs font-medium text-admin-text transition-colors duration-150 hover:bg-admin-raised"
                                    >
                                        Ver página
                                    </Link>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Total calculado na hora a partir dos itens e do desconto geral (nada disso é salvo).
function totalDaProposta(proposta: {
    discountType: DiscountType | null;
    discountValue: number | null;
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
        discountType: DiscountType | null;
        discountValue: number | null;
    }[];
}) {
    const items = proposta.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: toDiscount(item.discountType, item.discountValue),
    }));

    return projectTotal(
        items,
        toDiscount(proposta.discountType, proposta.discountValue),
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

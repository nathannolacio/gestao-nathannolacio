import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import * as z from "zod";
import { db } from "@/db";
import { formatCentsAsReais } from "@/lib/money";
import { ProposalForm, type ProposalFormValues } from "../../_components/proposal-form";

type EditarPropostaProps = {
    params: Promise<{ id: string }>;
};

// A página só repassa a promessa; o `await` fica dentro do Suspense (cacheComponents).
export default function EditarProposta({ params }: EditarPropostaProps) {
    return (
        <>
            <h1 className="font-display text-2xl font-medium tracking-tight">
                Editar proposta
            </h1>

            <div className="mt-6">
                <Suspense fallback={<FormSkeleton />}>
                    <FormularioDeEdicao params={params} />
                </Suspense>
            </div>
        </>
    );
}

// Desconto no formato do input: percentual = inteiro ("10"); fixo = reais ("50,00").
function discountToText(type: "percentage" | "fixed" | null, value: number | null) {
    if (type === null || value === null) return { type: "" as const, value: "" };

    return {
        type,
        value: type === "percentage" ? String(value) : formatCentsAsReais(value),
    };
}

async function FormularioDeEdicao({ params }: EditarPropostaProps) {
    await connection();
    const { id } = await params;

    // O id vem da URL: valida antes de consultar (um texto qualquer quebraria o cast para uuid).
    if (!z.uuid().safeParse(id).success) notFound();

    const proposal = await db.query.proposals.findFirst({
        where: { id, deletedAt: { isNull: true } },
        with: {
            client: true,
            items: { orderBy: { position: "asc" } },
        },
    });

    // Aprovada não edita (a action também recusa; aqui evita abrir o formulário à toa).
    if (!proposal || !proposal.client || proposal.status === "approved") notFound();

    const discount = discountToText(proposal.discountType, proposal.discountValue);

    const initialValues: ProposalFormValues = {
        title: proposal.title,
        deliveryDays: String(proposal.deliveryDays),
        hostingAnnual:
            proposal.hostingAnnual === null ? "" : formatCentsAsReais(proposal.hostingAnnual),
        discountType: discount.type,
        discountValue: discount.value,
        bonuses: proposal.bonuses.map((bonus) => bonus.id),
        items: proposal.items.map((item) => {
            const itemDiscount = discountToText(item.discountType, item.discountValue);

            return {
                description: item.description,
                quantity: String(item.quantity),
                unitPrice: formatCentsAsReais(item.unitPrice),
                discountType: itemDiscount.type,
                discountValue: itemDiscount.value,
            };
        }),
    };

    return (
        <ProposalForm
            mode="edit"
            proposalId={proposal.id}
            clientName={proposal.client.name}
            status={proposal.status}
            initialValues={initialValues}
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

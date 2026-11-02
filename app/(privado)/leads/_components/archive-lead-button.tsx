"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveLead, restoreLead } from "@/app/(privado)/leads/actions";
import { ArchiveIcon } from "../../_components/icons";

// Arquivar (lead ativo) ou Restaurar (lead arquivado). Arquivar pede confirmação e volta para a lista;
// restaurar fica na ficha, que passa a mostrar os formulários de novo. `compact` = ícone na linha da lista
// (arquiva e só atualiza a lista, sem sair dela).
export function ArchiveLeadButton({
    leadId,
    archived,
    compact = false,
}: {
    leadId: string;
    archived: boolean;
    compact?: boolean;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    function run() {
        if (
            !archived &&
            !window.confirm(
                "Arquivar este lead? Ele sai das listas e do Hoje, mas fica na aba Arquivados para revisitar.",
            )
        ) {
            return;
        }

        setError(null);
        startTransition(async () => {
            const res = archived ? await restoreLead({ id: leadId }) : await archiveLead({ id: leadId });
            if (!res.ok) {
                setError(res.error);
                return;
            }
            if (archived || compact) router.refresh();
            else router.push("/leads");
        });
    }

    if (compact) {
        return (
            <div className="flex flex-col items-end">
                <button
                    type="button"
                    disabled={isPending}
                    onClick={run}
                    title="Arquivar"
                    aria-label="Arquivar"
                    className="cursor-pointer rounded-lg p-2 text-admin-muted transition-colors duration-150 hover:bg-admin-raised hover:text-red-300 disabled:opacity-60"
                >
                    <ArchiveIcon className="size-4" />
                </button>
                {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
        );
    }

    return (
        <div>
            <button
                type="button"
                disabled={isPending}
                onClick={run}
                className={
                    archived
                        ? "cursor-pointer rounded-lg bg-dourado px-3 py-2 text-sm font-medium text-grafite transition-opacity duration-150 hover:opacity-90 disabled:opacity-60"
                        : "cursor-pointer rounded-lg border border-admin-line px-3 py-2 text-sm text-admin-muted transition-colors duration-150 hover:border-red-400/60 hover:text-red-300 disabled:opacity-60"
                }
            >
                {archived ? (isPending ? "Restaurando..." : "Restaurar lead") : isPending ? "Arquivando..." : "Arquivar"}
            </button>
            {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>
    );
}

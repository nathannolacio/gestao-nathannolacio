"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { archiveProposal, revertToDraft, sendProposal } from "../actions";
import {
    ArchiveIcon,
    EditIcon,
    ExternalIcon,
    SendIcon,
    UndoIcon,
} from "../../_components/icons";

type Props = {
    id: string;
    publicToken: string;
    status: "draft" | "sent" | "approved";
    // Só vem true em desenvolvimento (definido no Server Component).
    showDevRevert: boolean;
};

const iconButtonClass =
    "inline-flex size-8 items-center justify-center rounded-lg border border-admin-line text-admin-muted transition-colors duration-150 hover:bg-admin-raised hover:text-admin-text disabled:opacity-50";

export function ProposalActions({ id, publicToken, status, showDevRevert }: Props) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    function run(action: typeof sendProposal) {
        setError(null);
        startTransition(async () => {
            const result = await action({ id });

            if (!result.ok) {
                setError(result.formError);
            }
        });
    }

    function archive() {
        const ok = window.confirm(
            "Arquivar esta proposta? Ela some da listagem e o link público deixa de funcionar.",
        );

        if (ok) run(archiveProposal);
    }

    return (
        <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5">
                <Link
                    href={`/proposta/${publicToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={iconButtonClass}
                    title="Ver página"
                    aria-label="Ver página"
                >
                    <ExternalIcon className="size-4" />
                </Link>
                {status !== "approved" && (
                    <Link
                        href={`/admin/propostas/${id}/editar`}
                        className={iconButtonClass}
                        title="Editar"
                        aria-label="Editar"
                    >
                        <EditIcon className="size-4" />
                    </Link>
                )}
                {status === "draft" && (
                    <button
                        type="button"
                        disabled={isPending}
                        onClick={() => run(sendProposal)}
                        className={iconButtonClass}
                        title="Enviar"
                        aria-label="Enviar"
                    >
                        <SendIcon className="size-4" />
                    </button>
                )}
                {showDevRevert && status !== "draft" && (
                    <button
                        type="button"
                        disabled={isPending}
                        onClick={() => run(revertToDraft)}
                        className={iconButtonClass}
                        title="Voltar a rascunho (somente em desenvolvimento)"
                        aria-label="Voltar a rascunho"
                    >
                        <UndoIcon className="size-4" />
                    </button>
                )}
                {status !== "approved" && (
                    <button
                        type="button"
                        disabled={isPending}
                        onClick={archive}
                        className={`${iconButtonClass} hover:text-red-400`}
                        title="Arquivar"
                        aria-label="Arquivar"
                    >
                        <ArchiveIcon className="size-4" />
                    </button>
                )}
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
    );
}

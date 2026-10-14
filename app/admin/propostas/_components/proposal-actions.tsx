"use client";

import { useState, useTransition } from "react";
import { revertToDraft, sendProposal } from "../actions";

type Props = {
    id: string;
    status: "draft" | "sent" | "approved";
    // Só vem true em desenvolvimento (definido no Server Component).
    showDevRevert: boolean;
};

const buttonClass =
    "rounded-lg border border-admin-line px-3 py-1.5 text-xs font-medium text-admin-text transition-colors duration-150 hover:bg-admin-raised disabled:opacity-50";

export function ProposalActions({ id, status, showDevRevert }: Props) {
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

    return (
        <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
                {status === "draft" && (
                    <button
                        type="button"
                        disabled={isPending}
                        onClick={() => run(sendProposal)}
                        className={buttonClass}
                    >
                        {isPending ? "Enviando..." : "Enviar"}
                    </button>
                )}
                {showDevRevert && status !== "draft" && (
                    <button
                        type="button"
                        disabled={isPending}
                        onClick={() => run(revertToDraft)}
                        className={buttonClass}
                        title="Somente em desenvolvimento"
                    >
                        Voltar a rascunho
                    </button>
                )}
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
    );
}

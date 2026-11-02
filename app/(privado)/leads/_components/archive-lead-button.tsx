"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveLead } from "@/app/(privado)/leads/actions";

export function ArchiveLeadButton({ leadId }: { leadId: string }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    function archive() {
        const ok = window.confirm(
            "Arquivar este lead? Ele some das listas. Se a negociação só não deu certo, prefira o estágio Perdido.",
        );
        if (!ok) return;

        startTransition(async () => {
            const res = await archiveLead({ id: leadId });
            if (res.ok) {
                router.push("/leads");
            } else {
                setError(res.error);
            }
        });
    }

    return (
        <div>
            <button
                type="button"
                disabled={isPending}
                onClick={archive}
                className="cursor-pointer text-sm text-admin-muted transition-colors duration-150 hover:text-red-400 disabled:opacity-60"
            >
                Arquivar lead
            </button>
            {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>
    );
}

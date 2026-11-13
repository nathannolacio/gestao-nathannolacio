import Link from "next/link";

// Marca do sistema no topo do menu (sidebar e gaveta do mobile).
export function Brand() {
    return (
        <Link href="/hoje" className="flex items-center gap-2.5 rounded-lg px-2 py-1">
            <span
                aria-hidden="true"
                className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4b37a] via-dourado to-bronze font-display text-base font-semibold text-grafite shadow-[0_4px_14px_-6px_rgb(212_179_122/0.6)]"
            >
                N
            </span>
            <span className="leading-tight">
                <span className="block font-display text-base font-semibold tracking-tight text-admin-text">
                    Gestão
                </span>
                <span className="block text-[11px] text-admin-muted">Nathan Nolacio</span>
            </span>
        </Link>
    );
}

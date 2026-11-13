import Link from "next/link";
import type { ReactNode } from "react";

// Estilos de botão do admin, para todas as telas usarem o mesmo desenho.
export const buttonPrimary =
    "inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-[#c9a56c] to-dourado px-4 py-2 text-sm font-medium text-grafite shadow-[0_4px_16px_-6px_rgb(212_179_122/0.5)] transition-opacity duration-150 hover:opacity-90";
export const buttonSecondary =
    "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-admin-text shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] backdrop-blur-md transition-colors duration-150 hover:border-dourado/60 hover:bg-white/[0.08]";

// Cabeçalho padrão das páginas: título, descrição curta e ações à direita.
export function PageHeader({
    title,
    description,
    back,
    actions,
    children,
}: {
    title: ReactNode;
    description?: ReactNode;
    back?: { href: string; label: string };
    actions?: ReactNode;
    // Linha extra abaixo do título (badges, status).
    children?: ReactNode;
}) {
    return (
        <header className="flex flex-wrap items-end justify-between gap-4 pb-2">
            <div className="min-w-0">
                {back && (
                    <Link
                        href={back.href}
                        className="mb-1 inline-flex items-center gap-1 text-xs text-admin-muted hover:text-admin-text"
                    >
                        <span aria-hidden="true">←</span> {back.label}
                    </Link>
                )}
                <h1 className="font-display text-3xl font-semibold tracking-tight wrap-break-word">{title}</h1>
                {description && <p className="mt-1 text-sm text-admin-muted">{description}</p>}
                {children}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
    );
}

// Cor do ícone de cada indicador (fundo translúcido + traço da mesma cor).
const toneChip = {
    gold: "bg-gradient-to-br from-dourado/25 to-dourado/5 text-[#e0c088] ring-dourado/30",
    green: "bg-gradient-to-br from-emerald-400/20 to-emerald-400/5 text-emerald-300 ring-emerald-400/25",
    red: "bg-gradient-to-br from-rose-400/20 to-rose-400/5 text-rose-300 ring-rose-400/25",
    blue: "bg-gradient-to-br from-sky-400/20 to-sky-400/5 text-sky-300 ring-sky-400/25",
} as const;

// Bloco de indicador (ícone, rótulo, número grande e uma linha de contexto), usado no Hoje.
export function StatTile({
    label,
    value,
    hint,
    icon,
    tone = "gold",
    alert = false,
    featured = false,
    href,
}: {
    label: string;
    value: number | string;
    hint?: ReactNode;
    icon: ReactNode;
    tone?: keyof typeof toneChip;
    // Número em vermelho (ex.: há follow-up atrasado).
    alert?: boolean;
    featured?: boolean;
    href?: string;
}) {
    const body = (
        <>
            <span
                aria-hidden="true"
                className={`flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ring-inset sm:size-12 ${toneChip[tone]}`}
            >
                {icon}
            </span>
            <div className="min-w-0">
                <dt className="text-sm text-admin-muted">{label}</dt>
                <dd
                    className={`font-display text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl ${
                        alert ? "text-rose-300" : "text-admin-text"
                    }`}
                >
                    {value}
                </dd>
                {hint && <dd className="mt-0.5 text-xs text-admin-muted">{hint}</dd>}
            </div>
        </>
    );
    const className = `admin-card flex flex-col items-start gap-3 p-4 transition-colors duration-150 sm:flex-row sm:items-center sm:gap-4 sm:p-5 ${featured ? "admin-card-featured" : ""}`;

    return href ? (
        <Link href={href} className={`${className} hover:border-dourado/50`}>
            <dl className="contents">{body}</dl>
        </Link>
    ) : (
        <dl className={className}>{body}</dl>
    );
}

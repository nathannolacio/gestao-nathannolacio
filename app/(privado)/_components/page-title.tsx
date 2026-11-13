"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

// Seção do menu de cada rota, para a barra do topo dizer onde você está.
const sections: { prefix: string; group: string | null; label: string }[] = [
    { prefix: "/hoje", group: null, label: "Hoje" },
    { prefix: "/pipeline", group: "Comercial", label: "Pipeline" },
    { prefix: "/leads", group: "Comercial", label: "Leads" },
    { prefix: "/propostas", group: "Comercial", label: "Propostas" },
    { prefix: "/clientes", group: "Operação", label: "Clientes" },
    { prefix: "/contratos", group: "Operação", label: "Contratos" },
    { prefix: "/configuracoes/contratos", group: "Configurações", label: "Modelos de contrato" },
];

// Trilha "Comercial / Leads" na barra do topo (só desktop). O pathname é dado de
// requisição nas rotas dinâmicas, então fica dentro de <Suspense> (igual ao NavLink).
export function PageTitle() {
    return (
        <Suspense fallback={null}>
            <Trail />
        </Suspense>
    );
}

function Trail() {
    const pathname = usePathname();
    const section = sections.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`));
    if (!section) return null;

    return (
        <nav aria-label="Você está em" className="hidden items-center gap-2 text-sm md:flex">
            {section.group && (
                <>
                    <span className="text-admin-muted">{section.group}</span>
                    <span aria-hidden="true" className="text-admin-line">
                        /
                    </span>
                </>
            )}
            <Link href={section.prefix} className="text-admin-text hover:text-dourado">
                {section.label}
            </Link>
        </nav>
    );
}

"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { PlusIcon } from "./icons";

const entries = [
    { href: "/leads/novo", label: "Novo lead", hint: "Cadastro manual" },
    { href: "/leads/importar", label: "Importar lista", hint: "Lote de prospecção" },
    { href: "/propostas/nova", label: "Nova proposta", hint: "Cliente novo ou existente" },
];

// Botão "Novo" da barra do topo: criar qualquer coisa de qualquer tela.
// <details> já abre e fecha sozinho; aqui só fechamos ao clicar fora ou escolher um item.
export function NewMenu() {
    const ref = useRef<HTMLDetailsElement>(null);

    useEffect(() => {
        function onPointer(event: PointerEvent) {
            if (ref.current?.open && !ref.current.contains(event.target as Node)) ref.current.open = false;
        }
        document.addEventListener("pointerdown", onPointer);
        return () => document.removeEventListener("pointerdown", onPointer);
    }, []);

    return (
        <details ref={ref} className="relative">
            <summary className="flex h-10 cursor-pointer list-none items-center gap-1.5 rounded-full bg-gradient-to-b from-[#c9a56c] to-dourado px-4 shadow-[0_4px_18px_-6px_rgb(212_179_122/0.6)] text-sm font-medium text-grafite transition-opacity hover:opacity-90 [&::-webkit-details-marker]:hidden">
                <PlusIcon className="size-4" />
                <span className="hidden sm:inline">Novo</span>
                <span className="sr-only sm:hidden">Novo</span>
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-2xl border border-white/10 bg-admin-sidebar/95 p-1.5 shadow-2xl backdrop-blur-xl">
                {entries.map((entry) => (
                    <Link
                        key={entry.href}
                        href={entry.href}
                        onClick={() => ref.current && (ref.current.open = false)}
                        className="block rounded-xl px-3 py-2 hover:bg-white/5"
                    >
                        <span className="block text-sm text-admin-text">{entry.label}</span>
                        <span className="block text-xs text-admin-muted">{entry.hint}</span>
                    </Link>
                ))}
            </div>
        </details>
    );
}

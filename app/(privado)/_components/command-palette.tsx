"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { searchEverything, type SearchResult } from "../busca/actions";
import { SearchIcon } from "./icons";

type Item = { id: string; group: string; title: string; subtitle?: string | null; href: string };

// Atalhos que aparecem com a busca vazia (ou que casam com o texto digitado).
const quickActions: Item[] = [
    { id: "q-novo-lead", group: "Ações", title: "Novo lead", href: "/leads/novo" },
    { id: "q-importar", group: "Ações", title: "Importar lista de prospecção", href: "/leads/importar" },
    { id: "q-proposta", group: "Ações", title: "Nova proposta", href: "/propostas/nova" },
    { id: "q-hoje", group: "Ir para", title: "Hoje", href: "/hoje" },
    { id: "q-pipeline", group: "Ir para", title: "Pipeline", href: "/pipeline" },
    { id: "q-leads", group: "Ir para", title: "Leads", href: "/leads" },
    { id: "q-propostas", group: "Ir para", title: "Propostas", href: "/propostas" },
    { id: "q-clientes", group: "Ir para", title: "Clientes", href: "/clientes" },
];

const groupLabel: Record<SearchResult["kind"], string> = { lead: "Leads", client: "Clientes", proposal: "Propostas" };

function normalize(text: string) {
    return text
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase();
}

// Busca global (botão na barra do topo + atalho Ctrl/⌘ K). Feita com <dialog>, como a gaveta
// do mobile: o navegador cuida de Esc, foco preso e fundo inerte.
export function CommandPalette() {
    const router = useRouter();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [active, setActive] = useState(0);
    const [pending, startTransition] = useTransition();

    function open() {
        setQuery("");
        setResults([]);
        setActive(0);
        dialogRef.current?.showModal();
        inputRef.current?.focus();
    }

    function close() {
        dialogRef.current?.close();
    }

    // Ctrl+K / ⌘K abre de qualquer tela.
    useEffect(() => {
        function onKey(event: globalThis.KeyboardEvent) {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                if (dialogRef.current?.open) close();
                else open();
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Busca no servidor com uma pausa curta depois da digitação (não dispara a cada tecla).
    useEffect(() => {
        const text = query.trim();
        if (text.length < 2) return;
        const timer = setTimeout(() => {
            startTransition(async () => {
                const found = await searchEverything({ query: text });
                setResults(found);
                setActive(0);
            });
        }, 200);
        return () => clearTimeout(timer);
    }, [query]);

    const text = query.trim();
    const matchingActions = text
        ? quickActions.filter((action) => normalize(action.title).includes(normalize(text)))
        : quickActions;
    const found: Item[] =
        text.length >= 2
            ? results.map((result) => ({
                  id: `${result.kind}-${result.id}`,
                  group: groupLabel[result.kind],
                  title: result.title,
                  subtitle: result.subtitle,
                  href: result.href,
              }))
            : [];
    const items = [...found, ...matchingActions];

    function go(item: Item) {
        close();
        router.push(item.href);
    }

    function onInputKey(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((index) => Math.min(index + 1, items.length - 1));
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((index) => Math.max(index - 1, 0));
        } else if (event.key === "Enter" && items[active]) {
            event.preventDefault();
            go(items[active]);
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={open}
                aria-label="Buscar"
                className="flex h-10 cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] backdrop-blur-md text-sm whitespace-nowrap text-admin-muted transition-colors hover:border-admin-muted/50 hover:text-admin-text sm:w-56 lg:w-72"
            >
                <SearchIcon className="size-4" />
                <span className="hidden sm:inline lg:hidden">Buscar…</span>
                <span className="hidden truncate lg:inline">Buscar lead, cliente, proposta…</span>
                <kbd className="ml-auto hidden rounded-md border border-white/10 bg-white/5 px-1.5 font-sans text-[11px] whitespace-nowrap lg:inline">
                    Ctrl K
                </kbd>
            </button>

            <dialog
                ref={dialogRef}
                aria-label="Busca"
                onClick={(event) => event.target === event.currentTarget && close()}
                className="mx-auto mt-[12vh] w-[min(36rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-admin-sidebar/95 backdrop-blur-xl p-0 text-admin-text shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
            >
                <div className="flex items-center gap-3 border-b border-admin-line px-4">
                    <SearchIcon className="size-4 shrink-0 text-admin-muted" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(event) => {
                            setQuery(event.target.value);
                            setActive(0);
                        }}
                        onKeyDown={onInputKey}
                        placeholder="Buscar ou ir para…"
                        aria-label="Buscar"
                        className="h-12 flex-1 bg-transparent text-base outline-none placeholder:text-admin-muted sm:text-sm"
                    />
                    {pending && <span className="text-xs text-admin-muted">buscando…</span>}
                </div>

                <ul role="listbox" aria-label="Resultados" className="max-h-[50vh] overflow-y-auto p-2">
                    {text.length >= 2 && !pending && found.length === 0 && (
                        <li className="px-3 py-2 text-sm text-admin-muted">Nada encontrado para “{text}”.</li>
                    )}
                    {items.map((item, index) => {
                        const header = index === 0 || items[index - 1].group !== item.group ? item.group : null;
                        return (
                            <li key={item.id} role="presentation">
                                {header && (
                                    <p className="px-3 pt-2 pb-1 text-[11px] font-medium tracking-wider text-admin-muted/70 uppercase">
                                        {header}
                                    </p>
                                )}
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={index === active}
                                    onMouseMove={() => setActive(index)}
                                    onClick={() => go(item)}
                                    className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                                        index === active ? "bg-admin-raised text-admin-text" : "text-admin-text/90"
                                    }`}
                                >
                                    <span className="min-w-0 truncate">{item.title}</span>
                                    {item.subtitle && (
                                        <span className="shrink-0 text-xs text-admin-muted">{item.subtitle}</span>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </dialog>
        </>
    );
}

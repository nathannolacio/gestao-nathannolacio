"use client";

import Link from "next/link";
import { useRef, type MouseEvent, type ReactNode } from "react";
import { CloseIcon, MenuIcon } from "./icons";

// Gaveta do menu no mobile, feita com <dialog>: o navegador cuida de Esc, foco preso
// e inertização do fundo (showModal). `children` é o menu (Server Component) vindo do header.
export function MobileMenu({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Clique no fundo escurecido (o alvo é o próprio <dialog>) ou em qualquer link/botão
  // do menu fecha a gaveta. O "Sair" é um submit: fechar não atrapalha o envio do form.
  function handleClick(event: MouseEvent<HTMLDialogElement>) {
    const target = event.target as HTMLElement;
    if (target === event.currentTarget || target.closest("a")) {
      dialogRef.current?.close();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label="Abrir menu"
        className="-ml-2 flex size-10 cursor-pointer items-center justify-center rounded-lg text-admin-text transition-colors hover:bg-admin-raised"
      >
        <MenuIcon />
      </button>

      <dialog
        ref={dialogRef}
        onClick={handleClick}
        aria-label="Menu"
        className="m-0 h-dvh max-h-dvh w-64 max-w-[85vw] flex-col gap-6 border-r border-admin-line bg-admin-sidebar p-3 text-admin-text backdrop:bg-black/60 open:flex"
      >
        <div className="flex items-center justify-between">
          <Link
            href="/propostas"
            className="rounded-lg px-3 py-1 font-display text-lg font-medium tracking-tight"
          >
            Gestão
          </Link>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Fechar menu"
            className="flex size-10 cursor-pointer items-center justify-center rounded-lg text-admin-muted hover:bg-admin-raised hover:text-admin-text"
          >
            <CloseIcon />
          </button>
        </div>
        {children}
      </dialog>
    </>
  );
}

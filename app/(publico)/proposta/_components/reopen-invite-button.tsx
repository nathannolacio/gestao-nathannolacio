"use client";

import { REOPEN_INVITE_EVENT } from "./invite-gate";

// Botão do topo da proposta (Server Component) que reabre o convite. A página não consegue passar
// uma função ao `InviteGate`, então o aviso vai por um evento da janela que ele escuta.
export function ReopenInviteButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(REOPEN_INVITE_EVENT))}
      className={className}
    >
      Rever convite
    </button>
  );
}

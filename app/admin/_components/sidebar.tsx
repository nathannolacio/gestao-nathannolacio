import Link from "next/link";
import { ClientsIcon, LogoutIcon, ProposalsIcon, TemplateIcon } from "./icons";
import { NavLink } from "./nav-link";

const disabledItem =
  "flex shrink-0 cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-admin-muted/60";

export function Sidebar() {
  return (
    <aside className="flex shrink-0 items-center gap-1 border-b border-admin-line bg-admin-sidebar px-3 py-3 md:sticky md:top-0 md:h-screen md:w-60 md:flex-col md:items-stretch md:gap-8 md:border-r md:border-b-0 md:py-5">
      <Link
        href="/admin/propostas"
        className="shrink-0 rounded-lg px-3 py-1 font-display text-lg font-medium tracking-tight text-admin-text"
      >
        Gestão
      </Link>

      <nav
        aria-label="Principal"
        className="flex min-w-0 flex-1 items-center gap-1 md:flex-col md:items-stretch"
      >
        <NavLink href="/admin/propostas" icon={<ProposalsIcon />}>
          Propostas
        </NavLink>

        <span aria-disabled="true" title="Em breve" className={disabledItem}>
          <ClientsIcon />
          <span className="max-md:sr-only">Clientes</span>
        </span>

        <span aria-disabled="true" title="Em breve" className={disabledItem}>
          <TemplateIcon />
          <span className="max-md:sr-only">Modelo de textos</span>
        </span>
      </nav>

      {/* O logout será ligado ao Better Auth na Etapa 8 */}
      <button
        type="button"
        disabled
        title="Disponível depois do login (Etapa 8)"
        className="flex shrink-0 cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-admin-muted/60"
      >
        <LogoutIcon />
        <span className="max-md:sr-only">Sair</span>
      </button>
    </aside>
  );
}

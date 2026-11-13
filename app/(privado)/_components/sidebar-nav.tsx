import { logout } from "@/app/(publico)/login/actions";
import type { ReactNode } from "react";
import { ClientsIcon, LeadsIcon, LogoutIcon, PipelineIcon, ProposalsIcon, TemplateIcon, TodayIcon } from "./icons";
import { NavLink } from "./nav-link";
import { DueFollowUpsCount, NewLeadsCount, WaitingProposalsCount } from "./nav-counts";
import { InstallButton } from "./install-button";
import { PushToggle } from "./push-toggle";

const disabledItem =
  "flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm text-admin-muted/60 cursor-not-allowed";

// Grupo do menu, na ordem da jornada: Comercial (prospecção → proposta), Operação (entrega), Configurações.
function NavGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="px-3 pb-1 text-[11px] font-medium tracking-wider text-admin-muted/70 uppercase">{label}</p>
      {children}
    </div>
  );
}

// Itens do menu + "Sair". Usado pela sidebar (desktop) e pela gaveta (mobile),
// assim os dois nunca ficam diferentes.
export function SidebarNav() {
  return (
    <>
      <nav aria-label="Principal" className="flex flex-1 flex-col gap-5">
        <NavLink href="/hoje" icon={<TodayIcon />} badge={<DueFollowUpsCount />}>
          Hoje
        </NavLink>

        <NavGroup label="Comercial">
          <NavLink href="/pipeline" icon={<PipelineIcon />}>
            Pipeline
          </NavLink>
          <NavLink href="/leads" icon={<LeadsIcon />} badge={<NewLeadsCount />}>
            Leads
          </NavLink>
          <NavLink href="/propostas" icon={<ProposalsIcon />} badge={<WaitingProposalsCount />}>
            Propostas
          </NavLink>
        </NavGroup>

        <NavGroup label="Operação">
          <NavLink href="/clientes" icon={<ClientsIcon />}>
            Clientes
          </NavLink>
        </NavGroup>

        <NavGroup label="Configurações">
          <span aria-disabled="true" title="Em breve" className={disabledItem}>
            <TemplateIcon />
            Modelo de textos
          </span>
        </NavGroup>
      </nav>

      <div className="flex flex-col gap-0.5 border-t border-admin-line pt-3">
      <InstallButton />
      <PushToggle />

      <form action={logout}>
        <button
          type="submit"
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-1.5 text-sm text-admin-muted transition-colors hover:bg-admin-raised hover:text-admin-text"
        >
          <LogoutIcon />
          Sair
        </button>
      </form>
      </div>
    </>
  );
}

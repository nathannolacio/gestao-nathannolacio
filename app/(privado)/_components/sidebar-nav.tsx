import { logout } from "@/app/(publico)/login/actions";
import { ClientsIcon, LogoutIcon, ProposalsIcon, TemplateIcon } from "./icons";
import { NavLink } from "./nav-link";
import { PushToggle } from "./push-toggle";

const disabledItem =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-admin-muted/60 cursor-not-allowed";

// Itens do menu + "Sair". Usado pela sidebar (desktop) e pela gaveta (mobile),
// assim os dois nunca ficam diferentes.
export function SidebarNav() {
  return (
    <>
      <nav aria-label="Principal" className="flex flex-1 flex-col gap-1">
        <NavLink href="/propostas" icon={<ProposalsIcon />}>
          Propostas
        </NavLink>

        <span aria-disabled="true" title="Em breve" className={disabledItem}>
          <ClientsIcon />
          Clientes
        </span>

        <span aria-disabled="true" title="Em breve" className={disabledItem}>
          <TemplateIcon />
          Modelo de textos
        </span>
      </nav>

      <PushToggle />

      <form action={logout}>
        <button
          type="submit"
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-admin-muted transition-colors hover:bg-admin-raised hover:text-admin-text"
        >
          <LogoutIcon />
          Sair
        </button>
      </form>
    </>
  );
}

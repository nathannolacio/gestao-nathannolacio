import { Brand } from "./brand";
import { CommandPalette } from "./command-palette";
import { MobileMenu } from "./mobile-menu";
import { NewMenu } from "./new-menu";
import { PageTitle } from "./page-title";
import { SidebarNav } from "./sidebar-nav";

type HeaderProps = {
  userName: string;
  userEmail: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

// Barra do topo: onde estou (trilha), busca global (Ctrl/⌘ K), "Novo" e o usuário.
export function Header({ userName, userEmail }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b border-admin-line bg-admin-ground/80 px-4 backdrop-blur-md sm:px-6 md:static md:border-0 md:bg-transparent md:px-5 md:backdrop-blur-none">
      {/* Só mobile: hambúrguer (abre a gaveta com o menu). */}
      <div className="flex items-center md:hidden">
        <MobileMenu>
          <SidebarNav />
        </MobileMenu>
      </div>
      <div className="md:hidden">
        <Brand />
      </div>

      <PageTitle />

      <div className="ml-auto flex items-center gap-2">
        <CommandPalette />
        <NewMenu />
        <span
          title={`${userName} · ${userEmail}`}
          className="ml-1 flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-dourado to-bronze text-xs font-semibold text-grafite ring-2 ring-admin-ground"
        >
          <span aria-hidden="true">{initials(userName)}</span>
          <span className="sr-only">{userName}</span>
        </span>
      </div>
    </header>
  );
}

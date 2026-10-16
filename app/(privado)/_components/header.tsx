import Link from "next/link";
import { MobileMenu } from "./mobile-menu";
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

export function Header({ userName, userEmail }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-admin-line px-4 sm:px-6 md:justify-end md:px-8">
      {/* Só mobile: hambúrguer (abre a gaveta com o menu) + nome do sistema. */}
      <div className="flex items-center gap-1 md:hidden">
        <MobileMenu>
          <SidebarNav />
        </MobileMenu>
        <Link
          href="/propostas"
          className="rounded-lg px-2 py-1 font-display text-lg font-medium tracking-tight text-admin-text"
        >
          Gestão
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right leading-tight sm:block">
          <p className="text-sm text-admin-text">{userName}</p>
          <p className="text-xs text-admin-muted">{userEmail}</p>
        </div>
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-full bg-admin-raised text-xs font-medium text-dourado ring-1 ring-admin-line"
        >
          {initials(userName)}
        </span>
      </div>
    </header>
  );
}

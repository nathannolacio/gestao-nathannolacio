import Link from "next/link";
import { SidebarNav } from "./sidebar-nav";

// Só desktop (md+). No mobile o menu é a gaveta aberta pelo hambúrguer do header.
export function Sidebar() {
  return (
    <aside className="hidden shrink-0 border-r border-admin-line bg-admin-sidebar px-3 py-5 md:sticky md:top-0 md:flex md:h-screen md:w-60 md:flex-col md:gap-8">
      <Link
        href="/propostas"
        className="shrink-0 rounded-lg px-3 py-1 font-display text-lg font-medium tracking-tight text-admin-text"
      >
        Gestão
      </Link>
      <SidebarNav />
    </aside>
  );
}

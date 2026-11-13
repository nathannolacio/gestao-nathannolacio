import { Brand } from "./brand";
import { SidebarNav } from "./sidebar-nav";

// Só desktop (md+). No mobile o menu é a gaveta aberta pelo hambúrguer do header.
export function Sidebar() {
  return (
    <aside className="admin-card hidden shrink-0 px-3 py-4 md:sticky md:top-3 md:flex md:h-[calc(100dvh-1.5rem)] md:w-60 md:flex-col md:gap-6">
      <Brand />
      <SidebarNav />
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";

type NavLinkProps = {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  // Contador à direita (componente async do servidor, já dentro de <Suspense>).
  badge?: ReactNode;
};

// O pathname só é conhecido em tempo de requisição nas rotas com segmento dinâmico
// (ex.: /propostas/[id]/editar), então `usePathname` precisa ficar dentro de <Suspense>.
// O fallback é o mesmo link sem destaque: o menu já vem na casca estática e o item ativo
// entra por streaming.
export function NavLink(props: NavLinkProps) {
  return (
    <Suspense fallback={<NavLinkView {...props} active={false} />}>
      <ActiveNavLink {...props} />
    </Suspense>
  );
}

function ActiveNavLink(props: NavLinkProps) {
  const pathname = usePathname();
  const active = pathname === props.href || pathname.startsWith(`${props.href}/`);

  return <NavLinkView {...props} active={active} />;
}

function NavLinkView({ href, icon, children, badge, active }: NavLinkProps & { active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative flex shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-150 ${
        active
          ? "bg-gradient-to-r from-dourado/20 via-dourado/[0.06] to-transparent text-admin-text ring-1 ring-dourado/20 ring-inset [&>svg]:text-[#e0c088] [&>svg]:drop-shadow-[0_0_4px_rgb(212_179_122/0.5)]"
          : "text-admin-muted hover:bg-white/[0.04] hover:text-admin-text"
      }`}
    >
      {icon}
      <span>{children}</span>
      {badge && <Suspense fallback={null}>{badge}</Suspense>}
    </Link>
  );
}

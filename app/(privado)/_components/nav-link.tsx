"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";

type NavLinkProps = {
  href: string;
  icon: ReactNode;
  children: ReactNode;
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

function NavLinkView({ href, icon, children, active }: NavLinkProps & { active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150 ${
        active
          ? "bg-admin-raised text-admin-text [&_svg]:text-dourado"
          : "text-admin-muted hover:bg-admin-raised/60 hover:text-admin-text"
      }`}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}

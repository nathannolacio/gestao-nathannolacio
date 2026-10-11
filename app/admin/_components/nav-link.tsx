"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavLinkProps = {
  href: string;
  icon: ReactNode;
  children: ReactNode;
};

// Client Component só por causa do usePathname (marcar o item ativo).
export function NavLink({ href, icon, children }: NavLinkProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

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

import type { ReactNode } from "react";

// Usa .glow-card do globals.css: a borda brilha ao passar o mouse.
export function GlowCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="glow-card rounded-2xl bg-(--line) p-px">
      <div
        className={`glow-card-inner rounded-[15px] bg-(--card) p-6 ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

import { devDataStates } from "@/lib/proposal-mock";

// Só desenvolvimento: troca os dados da página por `?data=` (teste de pior caso).
export function DevDataToggle({ active }: { active: string }) {
  if (process.env.NODE_ENV === "production") return null;
  return (
    <nav
      aria-label="Dados de teste (somente dev)"
      className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 gap-1 rounded-full bg-neutral-300 p-1 font-sans text-xs text-neutral-800 shadow"
    >
      {devDataStates.map((s) => (
        <a
          key={s}
          href={s === "demo" ? "?" : `?data=${s}`}
          aria-current={s === active ? "page" : undefined}
          className={`rounded-full px-3 py-1 ${s === active ? "bg-white font-medium" : ""}`}
        >
          {s}
        </a>
      ))}
    </nav>
  );
}

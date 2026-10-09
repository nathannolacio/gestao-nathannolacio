import type { ReactNode } from "react";
import { Rich } from "./rich";

type SectionProps = {
  overlap?: boolean; // abre espaço no topo para um elemento da seção anterior que invade esta
  id?: string;
  tone?: "light" | "sand" | "dark";
  pill?: string;
  title?: string; // opcional quando bare
  bare?: boolean; // sem título padrão: o conteúdo monta o próprio layout
  split?: boolean; // título à esquerda, conteúdo à direita
  center?: boolean;
  children: ReactNode;
};

// Cada tom define variáveis que os filhos usam: --card, --line, --mute.
const tones = {
  sand: "bg-[#efe8da] text-grafite [--card:#ffffff] [--line:rgb(22_22_28/0.1)] [--mute:#6e6c66] [--strong:#16161c]",
  light:
    "bg-marfim text-grafite [--card:#ffffff] [--line:rgb(22_22_28/0.1)] [--mute:#6e6c66] [--strong:#16161c]",
  dark: "bg-grafite text-marfim [--card:rgb(255_255_255/0.05)] [--line:rgb(255_255_255/0.1)] [--mute:rgb(250_247_242/0.6)] [--strong:#faf7f2]",
};

export function Section({
  id,
  overlap,
  bare,
  tone = "light",
  pill,
  title,
  split,
  center,
  children,
}: SectionProps) {
  if (bare) {
    return (
      <section
        id={id}
        className={`animate-fade-up overflow-hidden ${tones[tone]}`}
      >
        <div
          className={`mx-auto max-w-6xl px-6 ${overlap ? "pt-64" : "pt-20"}`}
        >
          {children}
        </div>
      </section>
    );
  }

  const heading = (
    <div className={center ? "text-center" : ""}>
      {pill && (
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-(--line) px-3 py-1 text-sm text-(--mute)">
          <span className="size-1.5 rounded-full bg-dourado" />
          {pill}
        </p>
      )}
      <h2 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
        <Rich text={title ?? ""} as="title" />
      </h2>
    </div>
  );

  return (
    <section id={id} className={`animate-fade-up ${tones[tone]}`}>
      <div className={`mx-auto max-w-6xl px-6 pb-20 ${overlap ? "pt-64" : "pt-20"}`}>
        {split ? (
          <div className="grid gap-12 lg:grid-cols-2">
            {heading}
            <div>{children}</div>
          </div>
        ) : (
          <>
            {heading}
            <div className="mt-12">{children}</div>
          </>
        )}
      </div>
    </section>
  );
}

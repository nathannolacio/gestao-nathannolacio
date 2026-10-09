import type { ReactNode } from "react";
import { Rich } from "./rich";

type SectionProps = {
  overlap?: boolean; // abre espaço no topo para um elemento da seção anterior que invade esta
  id?: string;
  tone?: "light" | "sand" | "dark";
  title?: string; // opcional quando bare
  bare?: boolean; // sem título padrão: o conteúdo monta o próprio layout
  split?: boolean; // título à esquerda, conteúdo à direita
  center?: boolean;
  children: ReactNode;
};

// Cada tom define variáveis que os filhos usam: --card, --line, --mute.
const tones = {
  sand: "bg-[#efe8da] text-grafite [--card:#ffffff] [--line:rgb(22_22_28/0.1)] [--mute:#5f5d57] [--accent:#82612f] [--strong:#16161c]",
  light:
    "bg-marfim text-grafite [--card:#ffffff] [--line:rgb(22_22_28/0.1)] [--mute:#5f5d57] [--accent:#82612f] [--strong:#16161c]",
  dark: "bg-grafite text-marfim [--card:rgb(255_255_255/0.07)] [--line:rgb(255_255_255/0.12)] [--mute:rgb(250_247_242/0.72)] [--accent:#b4915a] [--strong:#faf7f2]",
};

export function Section({
  id,
  overlap,
  bare,
  tone = "light",
  title,
  split,
  center,
  children,
}: SectionProps) {
  if (bare) {
    return (
      <section
        id={id}
        className={`animate-fade-up overflow-clip ${tones[tone]}`}
      >
        <div
          className={`mx-auto max-w-6xl px-6 ${overlap ? "pt-28 lg:pt-64" : "pt-24 lg:pt-32"}`}
        >
          {children}
        </div>
      </section>
    );
  }

  const heading = (
    <div className={center ? "text-center" : ""}>
      <h2 className="text-balance font-display text-4xl leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
        <Rich text={title ?? ""} as="title" />
      </h2>
    </div>
  );

  return (
    <section id={id} className={`animate-fade-up ${tones[tone]}`}>
      <div className={`mx-auto max-w-6xl px-6 pb-24 lg:pb-32 ${overlap ? "pt-28 lg:pt-64" : "pt-24 lg:pt-32"}`}>
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

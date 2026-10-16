"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

// Tempo total da animação de abertura (aba + carta + fade da tela) antes de remover o convite.
const OPEN_MS = 2300;

type InviteGateProps = {
  token: string;
  clientName: string;
  senderName: string;
  // Decidido no servidor: proposta aprovada ou visita do dono (sem convite).
  skip: boolean;
  // ?convite=1 (só dono, para testar): ignora o "já abriu" do navegador.
  force: boolean;
  children: ReactNode;
};

// Formas de onda (2 períodos idênticos de 800 de largura cada, para o loop fechar sem emenda).
// Variar a forma evita que as camadas pareçam cópias umas das outras.
const waveShapes = {
  // senoide larga
  a: "M0 100 C200 0 600 200 800 100 C1000 0 1400 200 1600 100",
  // duas ondulações por período, mais nervosa
  b: "M0 110 C120 10 300 190 400 100 S700 20 800 110 C920 10 1100 190 1200 100 S1500 20 1600 110",
  // longa e suave, pouca amplitude
  c: "M0 100 C300 60 500 140 800 100 C1100 60 1300 140 1600 100",
} as const;

// Onda de seda: curva com contorno fino e preenchimento translúcido que se dissolve.
// Três níveis de "profundidade" são combinados nas classes: desfoque + opacidade (quanto mais
// longe, mais desfocada e apagada), velocidade (mais longe, mais lenta) e `parallax` (px de
// deslocamento com o ponteiro: o que está perto se mexe mais).
function SilkWave({
  className,
  color,
  duration,
  shape = "a",
  parallax,
  stroke = 1.5,
  reverse = false,
  flip = false,
}: {
  className: string;
  color: string; // "r g b" (formato do rgb() moderno, para aplicar opacidade)
  duration: number; // segundos por ciclo
  shape?: keyof typeof waveShapes;
  parallax: number;
  stroke?: number;
  reverse?: boolean;
  flip?: boolean;
}) {
  const path = waveShapes[shape];
  const gradientId = useId();
  return (
    // 1º wrapper: paralaxe do ponteiro (propriedade `translate`, que não briga com os `transform`
    // das animações abaixo). 2º: sobe-e-desce. 3º: o track que corre na horizontal.
    <div
      aria-hidden
      className={`wave-parallax absolute -inset-x-16 ${className}`}
      style={{
        translate: `calc(var(--px, 0) * ${-parallax}px) calc(var(--py, 0) * ${-parallax / 2}px)`,
      }}
    >
      <div className="animate-wave-bob size-full overflow-hidden">
        <div
          className={`h-full w-[200%] ${reverse ? "animate-marquee-reverse" : "animate-marquee"} ${
            flip ? "-scale-y-100" : ""
          }`}
          style={{ animationDuration: `${duration}s` }}
        >
          <svg
            viewBox="0 0 1600 200"
            preserveAspectRatio="none"
            className="size-full overflow-visible"
          >
            {/* preenchimento que se dissolve para baixo: sem borda reta no fundo da onda */}
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0.4" stopColor={`rgb(${color})`} stopOpacity="0.3" />
                <stop offset="1" stopColor={`rgb(${color})`} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${path} V200 H0 Z`} fill={`url(#${gradientId})`} />
            <path
              d={path}
              fill="none"
              stroke={`rgb(${color})`}
              strokeOpacity={0.65}
              strokeWidth={stroke}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

// Bokeh: pontos de luz dourada fora de foco que sobem devagar (tamanhos e desfoques variados
// dão a sensação de lentes com profundidade de campo).
const bokeh = [
  { left: "8%", size: 14, duration: 22, delay: 0, blur: 2, opacity: 0.5 },
  { left: "22%", size: 28, duration: 32, delay: -9, blur: 7, opacity: 0.35 },
  { left: "38%", size: 10, duration: 18, delay: -4, blur: 1, opacity: 0.6 },
  { left: "57%", size: 36, duration: 36, delay: -15, blur: 10, opacity: 0.3 },
  { left: "74%", size: 16, duration: 24, delay: -11, blur: 3, opacity: 0.5 },
  { left: "90%", size: 24, duration: 29, delay: -2, blur: 6, opacity: 0.4 },
] as const;

function Bokeh() {
  return (
    <>
      {bokeh.map((b) => (
        <span
          key={b.left}
          aria-hidden
          className="animate-bokeh absolute bottom-[-6%] rounded-full bg-dourado"
          style={{
            left: b.left,
            width: b.size,
            height: b.size,
            filter: `blur(${b.blur}px)`,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
            ["--o" as string]: b.opacity,
          }}
        />
      ))}
    </>
  );
}

// Faixa diagonal de texto em loop. O texto é repetido em duas metades idênticas e o track
// anda -50%: ao fim do ciclo a 2ª metade ocupa o lugar da 1ª, sem emenda visível.
function MarqueeBand({
  text,
  className,
  reverse = false,
}: {
  text: string;
  className: string;
  reverse?: boolean;
}) {
  const half = Array.from({ length: 6 });
  return (
    <div
      aria-hidden
      className={`absolute left-[-10%] w-[120%] overflow-hidden py-3 ${className}`}
    >
      <div
        className={`flex w-max ${reverse ? "animate-marquee-reverse" : "animate-marquee"}`}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {half.map((_, i) => (
              <span
                key={i}
                className="flex shrink-0 items-center gap-6 pr-6 font-display text-sm font-semibold uppercase tracking-[0.2em]"
              >
                {text}
                <span className="size-2 rounded-full border border-current" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Convite exibido por cima da proposta na 1ª visita (por navegador). A proposta fica
// renderizada por baixo (inerte e sem rolagem) e é revelada quando o cliente abre o envelope.
export function InviteGate({
  token,
  clientName,
  senderName,
  skip,
  force,
  children,
}: InviteGateProps) {
  const storageKey = `proposal-invite:${token}`;

  // "Já abriu neste navegador?" Lido do localStorage SEM efeito: no servidor vale `null`
  // (desconhecido), então o HTML inicial já sai com a tela do convite opaca, sem mostrar a
  // proposta e sem piscar o envelope para quem já abriu.
  const seen = useSyncExternalStore(
    () => () => {},
    useCallback(() => {
      try {
        return window.localStorage.getItem(storageKey) === "1";
      } catch {
        return false;
      }
    }, [storageKey]),
    () => null,
  );

  const [opened, setOpened] = useState(false);
  const [done, setDone] = useState(false);

  const phase: "gone" | "checking" | "showing" | "opening" = skip
    ? "gone"
    : opened
      ? done
        ? "gone"
        : "opening"
      : seen === null
        ? "checking"
        : seen && !force
          ? "gone"
          : "showing";

  const active = phase !== "gone";

  // Bloqueia a rolagem enquanto o convite está na tela.
  useEffect(() => {
    if (!active) return;
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = previous;
    };
  }, [active]);

  // Proposta inerte por baixo (sem foco de teclado nem leitor de tela). Via ref, não via
  // JSX, para o HTML do servidor não nascer inerte (quem está sem JS ainda consegue ler).
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (contentRef.current) contentRef.current.inert = active;
  }, [active]);

  // Paralaxe: posição do ponteiro de -1 a 1, gravada em variáveis CSS (sem re-render do React).
  // As ondas leem --px/--py e se deslocam mais quanto mais perto estão.
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    el.style.setProperty("--px", String((e.clientX / window.innerWidth - 0.5) * 2));
    el.style.setProperty("--py", String((e.clientY / window.innerHeight - 0.5) * 2));
  }

  function open() {
    if (phase !== "showing") return;
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      // sem storage: o convite só reaparece na próxima visita, sem problema
    }
    setOpened(true);
    window.setTimeout(() => setDone(true), OPEN_MS);
  }

  const opening = phase === "opening";
  const initial = senderName.trim().charAt(0).toUpperCase();

  return (
    <>
      <div ref={contentRef}>{children}</div>

      {active && (
        <div
          data-invite
          onPointerMove={handlePointerMove}
          role="dialog"
          aria-modal="true"
          aria-label="Convite para a proposta comercial"
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-grafite text-marfim [--accent:#b4915a] ${
            opening
              ? "pointer-events-none opacity-0 transition-opacity delay-1200 duration-1000"
              : ""
          }`}
        >
          {/* camada 1: bordas no grafite do projeto e centro aquecido (as ondas douradas pousam num tom quente) (centro mais claro, bordas escuras) */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 45%, #2c2720 0%, #1d1b1c 42%, var(--color-grafite) 70%, #0f0f13 100%)",
            }}
          />

          {/* camada 2: ondas de seda em 5 planos de profundidade (de trás para frente). Quanto
              mais longe: mais desfocada, mais apagada, mais lenta e menos reage ao ponteiro. */}
          <SilkWave
            className="top-[2%] h-[30%] opacity-45 blur-[10px]"
            color="124 90 52"
            shape="c"
            duration={70}
            parallax={6}
            stroke={1}
          />
          <SilkWave
            className="top-[22%] h-[36%] opacity-60 blur-[6px]"
            color="180 145 90"
            shape="a"
            duration={52}
            reverse
            parallax={14}
          />
          <SilkWave
            className="top-[40%] h-[38%] opacity-75 blur-[3px]"
            color="124 90 52"
            shape="b"
            duration={38}
            parallax={24}
            flip
          />
          <SilkWave
            className="bottom-[6%] h-[34%] opacity-90 blur-[1px]"
            color="180 145 90"
            shape="a"
            duration={26}
            reverse
            parallax={38}
            stroke={2}
          />
          {/* primeiro plano, fora de foco: dá a sensação de lente com profundidade de campo */}
          <SilkWave
            className="bottom-[-10%] h-[40%] opacity-50 blur-sm"
            color="180 145 90"
            shape="b"
            duration={19}
            parallax={60}
            stroke={3}
          />

          <Bokeh />

          {/* camada 3: duas faixas de texto em loop (paralaxe). Ficam NO FLUXO, uma acima e outra
              abaixo do conteúdo: assim nunca passam por trás do texto, em qualquer altura de tela. */}
          <div aria-hidden className="relative h-[10svh] min-h-12 w-full shrink-0">
            <MarqueeBand
              text="Proposta comercial"
              className="top-1/2 -translate-y-1/2 rotate-[-4deg] bg-linear-to-r from-bronze via-dourado to-bronze text-grafite shadow-[0_20px_50px_-20px_rgb(180_145_90/0.6)]"
            />
          </div>

          <div className="relative flex min-h-0 w-full flex-1 items-center justify-center px-6">
          {/* conteúdo só depois de saber se é 1ª visita (evita piscar para quem já abriu) */}
          {phase !== "checking" && (
            <div className="animate-fade-up relative flex flex-col items-center text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-dourado">
                Você recebeu um convite
              </p>
              {/* sombra escura dá profundidade e garante a leitura mesmo sobre as faixas */}
              <p className="mt-3 text-balance font-display text-3xl leading-tight tracking-tight [text-shadow:0_2px_20px_rgb(0_0_0/0.7)] sm:text-4xl">
                Proposta comercial para{" "}
                <span className="text-[#dcbf86]">{clientName}</span>
              </p>

              <button
                type="button"
                onClick={open}
                aria-label="Abrir proposta"
                className="group mt-10 flex cursor-pointer flex-col items-center gap-8 rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-8"
              >
                {/* envelope: aba gira para cima e a carta sobe */}
                <span className="animate-float relative block aspect-4/3 w-[min(80vw,22rem,38svh)] transition-transform duration-300 group-hover:scale-[1.03] perspective-[900px]">
                  {/* carta (atrás da frente do envelope) */}
                  <span
                    aria-hidden
                    className={`absolute inset-x-5 bottom-3 top-4 flex items-start justify-center rounded-xl border border-dourado/40 bg-[#242224] pt-4 shadow-md transition-transform delay-500 duration-1000 ease-out ${
                      opening ? "-translate-y-24" : ""
                    }`}
                  >
                    <span className="font-display text-sm uppercase tracking-widest text-dourado">
                      Proposta
                    </span>
                  </span>

                  {/* frente do envelope */}
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-2xl border border-dourado/30 bg-linear-to-b from-[#2e2b29] to-grafite shadow-[0_40px_80px_-20px_rgb(0_0_0/0.8),0_0_60px_-10px_rgb(180_145_90/0.25)]"
                  />

                  {/* aba (triângulo) */}
                  <span
                    aria-hidden
                    className={`absolute inset-x-0 top-0 block h-[58%] origin-top bg-linear-to-b from-dourado to-bronze transition-[transform,opacity] duration-1000 ${
                      opening ? "opacity-0 transform-[rotateX(180deg)]" : ""
                    }`}
                    style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
                  />

                  {/* lacre dourado na ponta da aba */}
                  <span
                    aria-hidden
                    className={`absolute left-1/2 top-[58%] flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center transition-opacity duration-500 ${
                      opening ? "opacity-0" : ""
                    }`}
                  >
                    <span className="animate-glow-pulse absolute -inset-1 rounded-full bg-dourado blur-md" />
                    <span className="relative flex size-full items-center justify-center rounded-full border-2 border-dourado bg-grafite font-display text-xl font-bold text-dourado shadow-lg">
                      {initial}
                    </span>
                  </span>
                </span>

                <span className="rounded-full bg-dourado px-7 py-3 font-display text-lg font-semibold text-grafite shadow-[0_10px_30px_-10px_rgb(180_145_90/0.7)] transition group-hover:bg-marfim">
                  Abrir proposta
                </span>
              </button>

              <p className="mt-6 rounded-full border border-dourado/30 bg-white/5 px-4 py-1.5 text-sm text-marfim/70 backdrop-blur-sm">
                Preparada por <span className="font-semibold text-marfim">{senderName}</span>
              </p>
            </div>
          )}
          </div>

          <div aria-hidden className="relative h-[10svh] min-h-12 w-full shrink-0">
            <MarqueeBand
              text="Sua proposta está pronta"
              className="top-1/2 -translate-y-1/2 rotate-3 border-y border-white/10 bg-white/4 text-marfim/40 blur-[1.5px] backdrop-blur-sm"
              reverse
            />
          </div>
        </div>
      )}

      {/* sem JS não há como abrir o convite: esconde para a proposta continuar legível */}
      <noscript>
        <style>{`[data-invite]{display:none!important}`}</style>
      </noscript>
    </>
  );
}

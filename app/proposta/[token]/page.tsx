import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import {
  formatBRL,
  itemSubtotal,
  pixTotal,
  projectSubtotal,
  projectTotal,
  splitPayment,
} from "@/lib/proposal-calc";
import { getMockProposal } from "@/lib/proposal-mock";
import { ApproveButton } from "../_components/approve-button";
import { ClientCard } from "../_components/client-card";
import { CoverGrid, Sunburst } from "../_components/cover-art";
import { Icon } from "../_components/icons";
import { ProjectCard } from "../_components/project-card";
import { Rich } from "../_components/rich";
import { Section } from "../_components/section";

export const metadata: Metadata = {
  title: "Proposta comercial",
  robots: { index: false, follow: false }, // link privado: fora do Google
};

// Foto da seção "Quem sou eu": o corpo se dissolve no fundo areia (esconde o corte dos braços).
// A foto aparece inteira da metade para cima (cabeça e topo dos ombros) e, daí para baixo, só
// dentro do disco dourado: o corpo termina exatamente na borda do disco (mesmo centro e raio).
// O círculo é uma elipse de 48% da largura × 36,08% da altura (= 48% × 962/1280, foto 962×1280).
const fadeToSand = [
  "linear-gradient(to bottom, black 50%, transparent 50%)",
  "radial-gradient(ellipse 48% 36.08% at 50% 50%, black 94%, transparent 100%)",
].join(", ");

// Pílula de valor usada no Investimento e no Pagamento.
const pill = "rounded-full px-4 py-1.5 font-display font-semibold";

type ProposalPageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ data?: string }>; // só dev: ?data=worst|one|empty
};

// A página em si não espera `params`: só repassa a promessa. O `await` fica
// em <Proposal>, dentro do Suspense (exigência do cacheComponents).
export default function ProposalPage({ params, searchParams }: ProposalPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-marfim text-cinza">
          Carregando proposta...
        </div>
      }
    >
      <Proposal params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Proposal({ params, searchParams }: ProposalPageProps) {
  // TODO (etapa 6): buscar a proposta no banco pelo token.
  const { token } = await params;
  void token;
  const { data } = await searchParams;
  const p = getMockProposal(data);
  const c = p.fixedContent;

  const subtotal = projectSubtotal(p.items);
  const total = projectTotal(p.items, p.discount);
  const generalDiscount = subtotal - total;
  const [entry, onDelivery] = splitPayment(total);
  const pixSaving = total - pixTotal(total);

  return (
    <main className="overflow-x-clip">
      {/* Capa */}
      <header className="relative z-20 flex min-h-svh flex-col rounded-b-[3rem] bg-marfim text-grafite [--accent:#82612f] shadow-[0_24px_40px_-24px_rgb(22_22_28/0.25)]">
        <div aria-hidden className="absolute inset-0 overflow-hidden rounded-b-[3rem]">
        {/* grade + sol */}
        <div
          aria-hidden
          className="absolute right-[6%] top-[14%] hidden aspect-square w-[min(56vw,720px)] lg:block"
          style={{
            maskImage:
              "radial-gradient(circle at center, black 35%, transparent 72%)",
          }}
        >
          <CoverGrid />
        </div>
        <Sunburst className="absolute bottom-[10%] right-[4%] hidden size-44 lg:block" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-8">
          <p className="font-display text-xl font-bold tracking-tight">
            {c.about.name}
          </p>
          <nav className="hidden gap-8 text-xs uppercase tracking-widest text-cinza sm:flex">
            <a href="#sobre" className="-my-3.5 py-3.5 hover:text-grafite">Sobre</a>
            <a href="#portfolio" className="-my-3.5 py-3.5 hover:text-grafite">Portfólio</a>
            <a href="#investimento" className="-my-3.5 py-3.5 hover:text-grafite">Investimento</a>
          </nav>
        </div>

        <div className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 content-center gap-14 px-6 pb-20 pt-16 lg:grid-cols-2 lg:items-center lg:pb-0">
          <div className="animate-fade-up relative">
            <h1 className="font-display text-[2.5rem] uppercase leading-[1.05] tracking-tight sm:text-7xl">
              Proposta comercial
              <br />
              de <span className="text-(--accent)">{p.title}</span>
            </h1>
            <p className="mt-6 max-w-md text-pretty text-lg leading-8 text-cinza">
              Escopo, prazo e investimento do seu projeto, reunidos em um só lugar.
            </p>
          </div>
          <div className="lg:flex lg:justify-center">
            <ClientCard clientName={p.clientName} />
          </div>
        </div>
      </header>

      {/* 1. Quem sou eu */}
      <Section id="sobre" tone="sand" bare>
        <div className="relative grid items-end gap-12 pb-4 lg:grid-cols-2 lg:pb-24">
          <div className="self-center pb-8">
            <h2 className="font-display text-5xl tracking-tight lg:text-6xl">
              {c.about.name}
            </h2>
            <p className="mb-8 mt-2 text-xl text-(--accent)">{c.about.role}</p>
            <div className="space-y-5 text-lg leading-8 text-(--mute)">
              {c.about.paragraphs.map((t) => (
                <p key={t}>
                  <Rich text={t} />
                </p>
              ))}
            </div>
          </div>

          {/* foto: PNG sem fundo, apoiada na base da seção */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative aspect-962/1280 w-full max-w-md">
              {/* disco dourado atrás: dá uma forma para o corpo "sair de dentro" */}
              <div
                aria-hidden
                className="absolute left-1/2 top-[14%] aspect-square w-[96%] -translate-x-1/2 rounded-full bg-linear-to-b from-dourado/45 to-bronze/15"
              />
              <Image
                src="/proposta/nathan-selfie.png"
                alt={c.about.name}
                fill
                sizes="(min-width: 1024px) 448px, 100vw"
                priority
                className="object-contain object-bottom"
                style={{
                  maskImage: fadeToSand,
                  WebkitMaskImage: fadeToSand,
                  // sem isso, a máscara repete e deixa uma linha de 1px da foto na borda de baixo
                  maskRepeat: "no-repeat",
                  WebkitMaskRepeat: "no-repeat",
                }}
              />            </div>
          </div>
        </div>
      </Section>

      {/* 2. Vantagens */}
      <Section tone="dark" bare>
        <div className="relative pb-24 pt-4 lg:pb-32">
          {/* brilhos de fundo */}
          <div
            aria-hidden
            className="absolute -right-32 -top-20 size-[28rem] rounded-full bg-dourado/10 blur-[120px]"
          />
          <div
            aria-hidden
            className="absolute -bottom-24 -left-32 size-[24rem] rounded-full bg-bronze/15 blur-[120px]"
          />
          <div className="relative grid gap-14 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <h2 className="text-balance font-display text-4xl leading-[1.1] tracking-tight sm:text-5xl">
                <Rich text={c.advantages.title} as="title" />
              </h2>
              <p className="mt-6 max-w-md text-lg leading-8 text-(--mute)">
                <Rich text={c.advantages.intro} />
              </p>
              <div className="mt-10 h-px w-24 bg-linear-to-r from-dourado to-transparent" />
            </div>

            <ul className="border-t border-(--line)">
              {c.advantages.items.map((i) => (
                <li
                  key={i.title}
                  className="grid gap-5 border-b border-(--line) py-8 sm:grid-cols-[auto_1fr] sm:gap-8"
                >
                  <span className="flex size-12 items-center justify-center rounded-full bg-dourado/15 text-dourado ring-1 ring-dourado/30">
                    <Icon name={i.icon} />
                  </span>
                  <div>
                    <h3 className="font-display text-2xl leading-tight">
                      {i.title}
                    </h3>
                    <p className="mt-2 max-w-prose text-lg leading-8 text-(--mute)">
                      {i.text}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* 5 + 9. Processo e prazo de entrega */}
      <Section tone="light" bare>
        <div className="grid gap-12 pb-24 pt-4 lg:grid-cols-2 lg:pb-32">
          <div className="flex flex-col gap-10 lg:sticky lg:top-24 lg:self-start">
            <h2 className="text-balance font-display text-3xl leading-[1.1] tracking-tight min-[400px]:text-4xl sm:text-5xl">
              <Rich text={c.process.title} as="title" />
            </h2>

            <div className="w-fit rounded-3xl border border-(--line) bg-(--card) p-6">
              <p className="text-base text-(--mute)">Prazo de entrega do projeto:</p>
              <p className="my-3 font-display text-5xl font-bold tracking-tight text-(--accent) sm:text-6xl">
                {p.deliveryDays} {p.deliveryDays === 1 ? "dia" : "dias"}
              </p>
              <p className="text-base text-(--mute)">{c.delivery.note}</p>
            </div>
          </div>

          <ol className="relative space-y-12 before:absolute before:bottom-4 before:left-4.5 before:top-4 before:w-px before:bg-dourado/50">
            {c.process.steps.map((s, idx) => {
              const last = idx === c.process.steps.length - 1;
              return (
                <li key={s.title} className="relative pl-16">
                  <span className="absolute left-0 top-0 flex size-9 items-center justify-center rounded-full border border-dourado bg-marfim font-display text-base font-semibold tabular-nums text-(--accent)">
                    {idx + 1}
                  </span>
                  <h3 className="pt-0.5 font-display text-2xl leading-tight">
                    {s.title}
                  </h3>
                  <p className="mt-2 max-w-prose text-lg leading-8 text-(--mute)">
                    {s.text}
                  </p>
                  {s.note && (
                    <p className="mt-2 text-base text-(--accent)">{s.note}</p>
                  )}
                  {last && (
                    <p className="mt-4 rounded-2xl bg-dourado/10 px-5 py-4 text-base leading-7 text-(--mute)">
                      {c.delivery.maintenance}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </Section>

      {/* 4. Portfólio */}
      <Section
        id="portfolio"
        tone="dark"
        title={c.portfolio.title}
        intro={c.portfolio.intro}
      >
        {/* mobile: carrossel com rolagem horizontal e encaixe (sem JS); a partir de sm: grade de 2 colunas */}
        <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
          {c.portfolio.projects.map((proj) => (
            <div
              key={proj.name}
              className="flex w-[85%] shrink-0 snap-center scroll-mx-6 *:w-full sm:w-auto"
            >
              <ProjectCard project={proj} />
            </div>
          ))}
        </div>
      </Section>

      {/* 6-8. Investimento + Bônus + Pagamento (card único, coluna centralizada) */}
      <Section id="investimento" tone="light" bare>
        <div className="relative pb-24 pt-4 lg:pb-32">
          {/* arcos laterais, como na referência */}
          <div
            aria-hidden
            className="absolute -bottom-72 -left-64 size-[32rem] rounded-full border-[110px] border-dourado/30"
          />
          <div
            aria-hidden
            className="absolute -bottom-72 -right-64 size-[32rem] rounded-full border-[110px] border-dourado/30"
          />

          <div className="relative mx-auto max-w-2xl rounded-4xl bg-white p-6 shadow-[0_40px_80px_-30px_rgb(22_22_28/0.25)] sm:p-10">
            <h2 className="text-balance text-center font-display text-4xl leading-tight tracking-tight sm:text-5xl">
              Investimento para <span className="text-(--accent)">o projeto</span>
            </h2>

            {/* serviços: uma lista só, com quantidade e desconto no detalhe */}
            <ul className="mt-8 space-y-3">
              {p.items.map((item) => {
                const subtotal = itemSubtotal(item);
                const hasDetail = item.quantity > 1 || Boolean(item.discount);
                const price = (
                  <span
                    className={`${pill} shrink-0 text-lg tabular-nums max-[419px]:mx-auto min-[420px]:ml-auto ${
                      subtotal === 0
                        ? "bg-dourado/25 text-bronze"
                        : "bg-dourado text-[#f3f3f3]" // = bg-grafite/5 sobre o card branco (fundo da pílula do serviço)
                    }`}
                  >
                    {subtotal === 0 ? "Incluso" : formatBRL(subtotal)}
                  </span>
                );

                // Sem detalhe (qtd 1 e sem desconto no item): linha fixa. Com detalhe: abre ao clicar na seta.
                return (
                  <li key={item.description}>
                    {hasDetail ? (
                      <details className="group rounded-3xl bg-grafite/5">
                        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-2 rounded-3xl px-5 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze [&::-webkit-details-marker]:hidden">
                          <svg
                            aria-hidden
                            viewBox="0 0 24 24"
                            className="size-4 shrink-0 text-(--mute) transition group-open:rotate-90"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M9 6l6 6-6 6" />
                          </svg>
                          <span className="min-w-0 flex-1 basis-40 text-balance text-lg font-medium max-[419px]:text-center">
                            {item.description}
                          </span>
                          {price}
                        </summary>
                        <p className="px-5 pb-4 pl-12 text-base text-(--mute)">
                          {item.quantity > 1 &&
                            `${item.quantity} × ${formatBRL(item.unitPrice)}`}
                          {item.quantity > 1 && item.discount && " · "}
                          {item.discount &&
                            (item.discount.type === "percent"
                              ? `${item.discount.value}% de desconto`
                              : `${formatBRL(item.discount.value)} de desconto`)}
                        </p>
                      </details>
                    ) : (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-3xl bg-grafite/5 px-5 py-3">
                        <span className="min-w-0 flex-1 basis-40 text-balance text-lg font-medium max-[419px]:text-center">
                          {item.description}
                        </span>
                        {price}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* total em destaque, com o desconto promocional (geral) numa pílula embaixo */}
            <div className="mt-3 rounded-3xl bg-linear-to-br from-dourado/25 to-dourado/10 px-6 py-5 text-center">
              <p className="text-base font-medium text-bronze">Total do projeto</p>
              <p className="font-display text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
                {formatBRL(total)}
              </p>
              {generalDiscount > 0 && (
                // branca, para não se confundir com as pílulas douradas de preço
                <span className="mt-3 inline-flex flex-wrap items-center justify-center gap-x-2 rounded-full bg-white px-4 py-1.5 text-base font-semibold text-bronze shadow-sm">
                  Desconto promocional
                  {p.discount?.type === "percent" && ` (${p.discount.value}%)`}
                  <span className="font-display tabular-nums">
                    − {formatBRL(generalDiscount)}
                  </span>
                </span>
              )}
            </div>

            {/* hospedagem: fora do total, como uma mini-seção própria com o mesmo destaque dos serviços */}
            {p.hostingAnnual !== null && (
              <div className="mt-12">
                <h3 className="text-balance text-center font-display text-2xl leading-tight sm:text-3xl">
                  Cobrança <span className="text-(--accent)">anual</span>
                </h3>
                <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-3xl bg-grafite/5 px-5 py-3">
                  <span className="min-w-0 flex-1 basis-40 text-balance text-lg font-medium max-[419px]:text-center">Hospedagem</span>
                  <span
                    className={`${pill} shrink-0 bg-dourado text-lg tabular-nums text-[#f3f3f3] max-[419px]:mx-auto min-[420px]:ml-auto`}
                  >
                    {formatBRL(p.hostingAnnual)}/ano
                  </span>
                </div>
                <p className="mt-3 text-center text-base text-(--mute)">
                  Pagamento anual, renovado todo ano. Pode ser parcelado. Cobrada à parte, fora
                  do total do projeto.
                </p>
              </div>
            )}

            {/* bônus: mini-seção, um card por bônus */}
            {p.bonuses.length > 0 && (
              <div className="mt-12">
                <h3 className="text-balance text-center font-display text-2xl leading-tight sm:text-3xl">
                  Seus <span className="text-(--accent)">bônus</span>
                </h3>
                <ul className="mt-5 space-y-3">
                  {p.bonuses.map((bonus) => (
                    <li key={bonus.title}>
                      <details className="group rounded-3xl bg-grafite/5">
                        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-2 rounded-3xl px-5 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze [&::-webkit-details-marker]:hidden">
                          <svg
                            aria-hidden
                            viewBox="0 0 24 24"
                            className="size-4 shrink-0 text-(--mute) transition group-open:rotate-90"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M9 6l6 6-6 6" />
                          </svg>
                          <span className="min-w-0 flex-1 text-lg font-medium">
                            {bonus.title}
                          </span>
                        </summary>
                        <p className="px-5 pb-4 pl-12 text-base leading-7 text-(--mute)">
                          {bonus.description}
                        </p>
                      </details>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* formas de pagamento */}
            <h3 className="mt-16 text-balance text-center font-display text-3xl leading-tight sm:text-4xl">
              <Rich text={c.payment.title} as="title" />
            </h3>
            <p className="mx-auto mt-2 max-w-md text-balance text-center text-base leading-7 text-(--mute)">
              {c.payment.intro}
            </p>

            <div className="mt-6 space-y-3">
              {c.payment.methods.map((m) =>
                m.id === "pix" ? (
                  <div
                    key={m.id}
                    className="rounded-3xl border border-dourado/40 bg-dourado/10 p-5"
                  >
                    <span className="rounded-full bg-dourado/25 px-3 py-1 text-sm font-semibold text-bronze">
                      Melhor opção
                    </span>
                    <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                      <div className="min-w-0">
                        <p className="text-lg font-medium">{m.title}</p>
                        <p className="text-base text-(--mute)">{m.text}</p>
                      </div>
                      <div className="shrink-0 sm:text-right">
                        <p className="text-base text-(--mute) line-through tabular-nums">
                          {formatBRL(total)}
                        </p>
                        <p className="font-display text-4xl font-bold tracking-tight tabular-nums text-bronze">
                          {formatBRL(pixTotal(total))}
                        </p>
                        <p className="text-base font-medium text-bronze">
                          Você economiza {formatBRL(pixSaving)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : m.id === "split" ? (
                  <div key={m.id} className="rounded-3xl bg-grafite/5 px-5 py-4">
                    <p className="text-lg font-medium">{m.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-base text-(--mute)">
                      <span>50% na entrada</span>
                      <span className={`${pill} bg-white text-grafite tabular-nums`}>
                        {formatBRL(entry)}
                      </span>
                      <span>50% na entrega</span>
                      <span className={`${pill} bg-white text-grafite tabular-nums`}>
                        {formatBRL(onDelivery)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="rounded-3xl bg-grafite/5 px-5 py-4">
                    <p className="text-lg font-medium">{m.title}</p>
                    <p className="text-base text-(--mute)">{m.text}</p>
                  </div>
                ),
              )}
            </div>

            <div className="mt-8 flex justify-center">
              <ApproveButton />
            </div>
          </div>

          <p className="relative mt-10 text-center font-display text-2xl font-bold tracking-tight">
            {c.about.name}
          </p>
        </div>
      </Section>

      {/* FAQ */}
      <Section tone="dark" title={c.faq.title} split>
        <div className="border-t border-(--line)">
          {c.faq.items.map((f, idx) => (
            <details
              key={f.question}
              open={idx === 0}
              className="group border-b border-(--line)"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-lg py-6 font-display text-xl leading-snug">
                {f.question}
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="size-6 shrink-0 text-(--accent) transition group-open:rotate-45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </summary>
              <p className="max-w-prose pb-6 pr-10 text-lg leading-8 text-(--mute)">
                {f.answer}
              </p>
            </details>
          ))}
        </div>
      </Section>

      <footer className="bg-grafite pb-10 text-marfim">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center gap-2 border-t border-white/10 pt-8 text-center text-sm sm:flex-row sm:justify-between sm:text-left">
            <p className="font-display text-base">{c.about.name}</p>
            <p className="text-marfim/60">{c.about.role}</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

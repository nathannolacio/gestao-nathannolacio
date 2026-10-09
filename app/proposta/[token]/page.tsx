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
import { DevDataToggle } from "../_components/dev-data-toggle";
import { Icon } from "../_components/icons";
import { ProjectCard } from "../_components/project-card";
import { Rich } from "../_components/rich";
import { Section } from "../_components/section";

export const metadata: Metadata = {
  title: "Proposta comercial",
  robots: { index: false, follow: false }, // link privado: fora do Google
};

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
          className="absolute right-[6%] top-[14%] hidden aspect-square w-[min(44vw,560px)] lg:block"
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

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-14 px-6 pt-16">
          <div className="animate-fade-up relative -top-12">
            <h1 className="font-display text-5xl uppercase leading-[1.05] tracking-tight sm:text-7xl">
              Proposta
              <br />
              de <span className="text-(--accent)">{p.title}</span>
            </h1>
          </div>
          <div className="-mb-44">
            <ClientCard clientName={p.clientName} />
          </div>
        </div>
      </header>

      {/* 1. Quem sou eu */}
      <Section id="sobre" overlap tone="sand" bare>
        <div className="relative grid items-end gap-12 lg:grid-cols-2">
          <div className="self-center pb-20">
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

          {/* foto: PNG sem fundo, apoiada na base do arco */}
          <div className="relative flex justify-center lg:justify-end">
            <div
              aria-hidden
              className="absolute -right-10 bottom-0 h-3/4 w-3/4 rounded-full bg-linear-to-t from-dourado/50 to-transparent blur-3xl"
            />
            <span
              aria-hidden
              className="absolute -top-6 right-0 select-none font-display text-[22rem] leading-none text-grafite/5"
            >
              {c.about.name[0]}
            </span>
            <div className="relative h-120 w-full max-w-80 overflow-hidden rounded-t-[10rem] bg-linear-to-b from-dourado/30 to-bronze/50">
              <Image
                src="/proposta/nathan.png"
                alt={c.about.name}
                fill
                sizes="320px"
                priority
                className="origin-bottom scale-112 object-contain object-bottom"
              />
            </div>
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
      <Section id="portfolio" tone="sand" title={c.portfolio.title}>
        <div className="grid gap-5 sm:grid-cols-2">
          {c.portfolio.projects.map((proj) => (
            <ProjectCard key={proj.name} project={proj} />
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
            <ul className="mt-8 divide-y divide-(--line)">
              {p.items.map((item) => (
                <li
                  key={item.description}
                  className="flex flex-col gap-1 py-4 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between min-[420px]:gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-lg font-medium">{item.description}</p>
                    {(item.quantity > 1 || item.discount) && (
                      <p className="mt-0.5 text-base text-(--mute)">
                        {item.quantity > 1 &&
                          `${item.quantity} × ${formatBRL(item.unitPrice)}`}
                        {item.quantity > 1 && item.discount && " · "}
                        {item.discount &&
                          (item.discount.type === "percent"
                            ? `${item.discount.value}% de desconto`
                            : `${formatBRL(item.discount.value)} de desconto`)}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 font-display text-xl font-semibold tabular-nums">
                    {formatBRL(itemSubtotal(item))}
                  </span>
                </li>
              ))}
            </ul>

            {/* total em destaque */}
            <div className="mt-2 rounded-3xl bg-linear-to-br from-dourado/25 to-dourado/10 px-6 py-5 text-center">
              <p className="text-base font-medium text-bronze">Total do projeto</p>
              <p className="font-display text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
                {formatBRL(total)}
              </p>
              {generalDiscount > 0 && (
                <p className="mt-1 text-base text-(--mute)">
                  já com {formatBRL(generalDiscount)} de desconto aplicado
                </p>
              )}
            </div>

            {/* hospedagem: fora do total, em linha própria para não passar batido */}
            {p.hostingMonthly !== null && (
              <p className="mt-5 flex items-baseline justify-between gap-4 text-base text-(--mute)">
                <span>Hospedagem mensal, cobrada à parte</span>
                <strong className="shrink-0 font-semibold tabular-nums text-grafite">
                  {formatBRL(p.hostingMonthly)}/mês
                </strong>
              </p>
            )}

            {p.bonus && (
              <p className="mt-5 rounded-2xl border border-dashed border-dourado/50 px-5 py-4 text-center text-base leading-7 text-(--mute)">
                <strong className="text-bronze">Bônus:</strong> {p.bonus}
              </p>
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

            {/* fechar: leva ao botão de aprovar no fim da página */}
            <a
              href="#aprovar"
              className="mx-auto mt-8 flex w-fit items-center gap-3 rounded-full bg-dourado px-7 py-3.5 font-semibold text-grafite shadow-lg shadow-dourado/30 transition hover:bg-bronze hover:text-marfim focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bronze active:scale-95"
            >
              Quero fechar o projeto agora
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
          </div>

          <p className="relative mt-10 text-center font-display text-2xl font-bold tracking-tight">
            {c.about.name}
          </p>
        </div>
      </Section>

      {/* FAQ */}
      <Section tone="sand" title={c.faq.title} split>
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

      {/* Aprovar */}
      <footer
        id="aprovar"
        className="bg-linear-to-br from-bronze to-[#8a6a3a] px-6 py-24 text-center text-marfim [--accent:#faf7f2] lg:py-32"
      >
        <div className="mx-auto max-w-3xl">
          <h2 className="text-balance font-display text-4xl leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Tudo certo com a proposta?
          </h2>
          <p className="mx-auto mb-10 mt-6 max-w-xl text-pretty text-lg leading-8 text-marfim">
            Ao aprovar, entro em contato para formalizarmos o contrato.
          </p>
          <ApproveButton />
        </div>
      </footer>
      <DevDataToggle active={data ?? "demo"} />
    </main>
  );
}

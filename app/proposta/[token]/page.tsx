import type { Metadata } from "next";
import { Suspense } from "react";
import {
  formatBRL,
  itemSubtotal,
  pixTotal,
  projectSubtotal,
  projectTotal,
  splitPayment,
} from "@/lib/proposal-calc";
import { mockProposal } from "@/lib/proposal-mock";
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

// Pílula de valor usada no Investimento e no Pagamento.
const pill = "rounded-full px-4 py-1.5 font-display font-semibold";

type ProposalPageProps = { params: Promise<{ token: string }> };

// A página em si não espera `params`: só repassa a promessa. O `await` fica
// em <Proposal>, dentro do Suspense (exigência do cacheComponents).
export default function ProposalPage({ params }: ProposalPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-marfim text-cinza">
          Carregando proposta...
        </div>
      }
    >
      <Proposal params={params} />
    </Suspense>
  );
}

async function Proposal({ params }: ProposalPageProps) {
  // TODO (etapa 6): buscar a proposta no banco pelo token.
  const { token } = await params;
  void token;
  const p = mockProposal;
  const c = p.fixedContent;

  const subtotal = projectSubtotal(p.items);
  const total = projectTotal(p.items, p.discount);
  const generalDiscount = subtotal - total;
  const [entry, onDelivery] = splitPayment(total);
  const pixSaving = total - pixTotal(total);

  return (
    <main>
      {/* Capa */}
      <header className="relative z-20 flex min-h-svh flex-col rounded-b-[3rem] bg-marfim text-grafite shadow-[0_24px_40px_-24px_rgb(22_22_28/0.25)]">
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
            <a href="#sobre" className="hover:text-grafite">Sobre</a>
            <a href="#portfolio" className="hover:text-grafite">Portfólio</a>
            <a href="#investimento" className="hover:text-grafite">Investimento</a>
          </nav>
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-14 px-6 pt-16">
          <div className="animate-fade-up relative -top-12">
            <h1 className="font-display text-5xl uppercase leading-[1.05] tracking-tight sm:text-7xl">
              Proposta
              <br />
              de <span className="text-dourado">{p.title}</span>
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
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-(--line) px-3 py-1 text-sm text-(--mute)">
              <span className="size-1.5 rounded-full bg-dourado" />
              {c.about.title}
            </p>
            <h2 className="font-display text-5xl tracking-tight">
              {c.about.name}
            </h2>
            <p className="mb-8 mt-2 text-xl text-dourado">{c.about.role}</p>
            <div className="space-y-5 text-lg leading-8 text-(--mute)">
              {c.about.paragraphs.map((t) => (
                <p key={t}>
                  <Rich text={t} />
                </p>
              ))}
            </div>
          </div>

          {/* foto: placeholder até termos a imagem real (PNG sem fundo) */}
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
            <div className="relative flex h-[30rem] w-80 items-end justify-center rounded-t-[10rem] bg-linear-to-b from-dourado/30 to-bronze/50 pb-6 text-sm text-grafite/50">
              Foto
            </div>
          </div>
        </div>
      </Section>

      {/* 2. Vantagens */}
      <Section tone="dark" bare>
        <div className="relative pb-24 pt-4">
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
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-(--line) px-3 py-1 text-sm text-(--mute)">
                <span className="size-1.5 rounded-full bg-dourado" />
                Vantagens
              </p>
              <h2 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
                <Rich text={c.advantages.title} as="title" />
              </h2>
              <p className="mt-6 max-w-md text-lg leading-8 text-(--mute)">
                <Rich text={c.advantages.intro} />
              </p>
              <div className="mt-10 h-px w-24 bg-linear-to-r from-dourado to-transparent" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {c.advantages.items.map((i) => (
                <div
                  key={i.title}
                  className="min-h-56 rounded-2xl border border-(--line) bg-(--card) p-6"
                >
                  <span className="mb-8 flex size-12 items-center justify-center rounded-2xl bg-dourado/15 text-dourado ring-1 ring-dourado/30">
                    <Icon name={i.icon} />
                  </span>
                  <h3 className="mb-2 font-display text-xl">{i.title}</h3>
                  <p className="text-sm leading-6 text-(--mute)">{i.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* 5 + 9. Processo e prazo de entrega */}
      <Section tone="light" bare>
        <div className="grid gap-12 pb-24 pt-4 lg:grid-cols-2">
          <div className="flex flex-col justify-between gap-10">
            <div>
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-(--line) px-3 py-1 text-sm text-(--mute)">
                <span className="size-1.5 rounded-full bg-dourado" />
                Etapa por etapa
              </p>
              <h2 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
                <Rich text={c.process.title} as="title" />
              </h2>
            </div>

            <div className="w-fit rounded-3xl border border-(--line) bg-(--card) p-6 shadow-sm">
              <p className="text-(--mute)">Prazo de entrega do projeto:</p>
              <p className="my-3 border-l-2 border-dourado pl-4 font-display text-4xl font-bold sm:text-5xl">
                {p.deliveryDays} dias
              </p>
              <p className="text-sm text-(--mute)">{c.delivery.note}</p>
            </div>
          </div>

          <ol className="relative ml-2 space-y-10 border-l border-dourado/60 pl-8">
            {c.process.steps.map((s, idx) => {
              const last = idx === c.process.steps.length - 1;
              return (
                <li key={s.title} className="relative">
                  <span className="absolute -left-[37px] top-2 size-2.5 rounded-full bg-dourado" />
                  {s.note && (
                    <p className="mb-1 text-sm italic text-(--mute)">{s.note}</p>
                  )}
                  <h3 className="font-display text-xl">
                    {s.title} {last && <span aria-hidden>🚀</span>}
                  </h3>
                  <p className="text-(--mute)">{s.text}</p>
                  {last && (
                    <p className="mt-3 rounded-2xl bg-dourado/10 px-4 py-3 text-sm text-(--mute)">
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
      <Section id="portfolio" tone="dark" pill="Portfólio" title={c.portfolio.title}>
        <div className="grid gap-5 sm:grid-cols-2">
          {c.portfolio.projects.map((proj) => (
            <ProjectCard key={proj.name} project={proj} />
          ))}
        </div>
      </Section>

      {/* 6-8. Investimento + Bônus + Pagamento (coluna única, centralizada) */}
      <Section id="investimento" tone="light" bare>
        <div className="relative pb-24 pt-4">
          {/* arcos laterais, como na referência */}
          <div
            aria-hidden
            className="absolute -bottom-72 -left-64 size-[32rem] rounded-full border-[110px] border-dourado/30"
          />
          <div
            aria-hidden
            className="absolute -bottom-72 -right-64 size-[32rem] rounded-full border-[110px] border-dourado/30"
          />

          <div className="relative mx-auto max-w-2xl rounded-[3rem] border border-white bg-[#f4efe6] p-6 shadow-[0_50px_100px_-40px_rgb(22_22_28/0.3)] sm:p-12">
            {/* 1. título */}
            <div className="text-center">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-(--line) px-3 py-1 text-sm text-(--mute)">
                <span className="size-1.5 rounded-full bg-dourado" />
                Bora para o que mais interessa?
              </p>
              <h2 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
                <Rich text="*Serviços* solicitados:" as="title" />
              </h2>
            </div>

            {/* 2. serviços */}
            <ul className="mt-8 space-y-3">
              {p.items.map((item) => (
                <li
                  key={item.description}
                  className="flex items-center gap-4 rounded-full border border-dourado/30 bg-dourado/10 px-6 py-3"
                >
                  <span className="size-2 shrink-0 rounded-full bg-dourado" />
                  <div>
                    <p className="text-sm font-medium">{item.description}</p>
                    <p className="text-xs text-(--mute)">
                      Quantidade: {item.quantity}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {/* 3. card: investimento -> bônus -> pagamento -> fechar */}
            <div className="mt-8 rounded-[2.5rem] border border-white bg-white p-6 shadow-[0_40px_80px_-30px_rgb(22_22_28/0.25)] sm:p-8">
              <h3 className="text-center font-display text-3xl leading-tight">
                Investimento para <span className="text-dourado">o projeto</span>
              </h3>

              <ul className="mt-6 space-y-2">
                {p.items.map((item) => (
                  <li
                    key={item.description}
                    className="flex items-center justify-between gap-4 rounded-full bg-grafite/5 py-2 pl-5 pr-2"
                  >
                    <span className="min-w-0 truncate text-sm">
                      <span className="mr-2 text-dourado">›</span>
                      {item.description}
                      {item.discount && (
                        <span className="ml-2 text-xs text-(--mute)">
                          (
                          {item.discount.type === "percent"
                            ? `${item.discount.value}% off`
                            : `${formatBRL(item.discount.value)} off`}
                          )
                        </span>
                      )}
                    </span>
                    <span className={`${pill} shrink-0 bg-dourado/20 text-bronze`}>
                      {formatBRL(itemSubtotal(item))}
                    </span>
                  </li>
                ))}
              </ul>

              {/* total em destaque */}
              <div className="mt-4 rounded-3xl bg-linear-to-br from-dourado/25 to-dourado/10 px-6 py-5 text-center">
                <p className="text-sm text-bronze">Total do projeto</p>
                <p className="font-display text-5xl font-bold">
                  {formatBRL(total)}
                </p>
                {generalDiscount > 0 && (
                  <p className="mt-1 text-xs text-(--mute)">
                    já com {formatBRL(generalDiscount)} de desconto aplicado
                  </p>
                )}
                {p.hostingMonthly !== null && (
                  <p className="mt-3 border-t border-dourado/30 pt-3 text-xs text-(--mute)">
                    + Hospedagem mensal, à parte:{" "}
                    <strong className="text-grafite">
                      {formatBRL(p.hostingMonthly)}/mês
                    </strong>
                  </p>
                )}
              </div>

              {p.bonus && (
                <p className="mt-3 rounded-2xl border border-dashed border-dourado/50 px-5 py-3 text-center text-sm text-(--mute)">
                  🎁 <strong className="text-bronze">Bônus:</strong> {p.bonus}
                </p>
              )}

              {/* formas de pagamento */}
              <h3 className="mt-10 text-center font-display text-3xl">
                <Rich text={c.payment.title} as="title" />
              </h3>
              <p className="mt-1 text-center text-xs text-(--mute)">
                {c.payment.intro}
              </p>

              <div className="mt-5 space-y-3">
                {c.payment.methods.map((m) =>
                  m.id === "pix" ? (
                    <div
                      key={m.id}
                      className="rounded-[1.75rem] border border-dourado/40 bg-dourado/10 p-5"
                    >
                      <span className="rounded-full bg-dourado/25 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-bronze">
                        Melhor opção
                      </span>
                      <div className="mt-3 flex items-end justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{m.title}</p>
                          <p className="text-xs text-(--mute)">{m.text}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs text-(--mute) line-through">
                            {formatBRL(total)}
                          </p>
                          <p className="font-display text-3xl font-bold text-bronze">
                            {formatBRL(pixTotal(total))}
                          </p>
                          <p className="text-[11px] font-medium text-emerald-700">
                            Você economiza {formatBRL(pixSaving)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : m.id === "split" ? (
                    <div
                      key={m.id}
                      className="rounded-[1.75rem] bg-grafite/5 px-5 py-4"
                    >
                      <p className="text-sm font-medium">{m.title}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-(--mute)">
                        <span>50% na entrada</span>
                        <span className={`${pill} bg-white text-grafite`}>
                          {formatBRL(entry)}
                        </span>
                        <span className="ml-1">50% na entrega</span>
                        <span className={`${pill} bg-white text-grafite`}>
                          {formatBRL(onDelivery)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={m.id}
                      className="rounded-[1.75rem] bg-grafite/5 px-5 py-4"
                    >
                      <p className="text-sm font-medium">{m.title}</p>
                      <p className="text-xs text-(--mute)">{m.text}</p>
                    </div>
                  ),
                )}
              </div>

              {/* fechar: leva ao botão de aprovar no fim da página */}
              <a
                href="#aprovar"
                className="mx-auto mt-8 flex w-fit items-center gap-3 rounded-full bg-dourado px-7 py-3.5 font-semibold text-grafite shadow-lg shadow-dourado/30 transition hover:bg-bronze hover:text-marfim active:scale-95"
              >
                Quero fechar o projeto agora
                <span aria-hidden>→</span>
              </a>
            </div>

            <p className="mt-10 text-center font-display text-2xl font-bold tracking-tight">
              {c.about.name}
            </p>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section tone="dark" pill="Dúvidas" title={c.faq.title} center>
        <div className="mx-auto max-w-3xl space-y-3">
          {c.faq.items.map((f, idx) => (
            <details
              key={f.question}
              className="group rounded-3xl border border-(--line) bg-(--card) p-6"
            >
              <summary className="flex cursor-pointer list-none items-center gap-4 font-medium">
                <span className="font-display text-dourado">{idx + 1}</span>
                {f.question}
                <span className="ml-auto text-dourado transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-4 pl-8 text-sm leading-6 text-(--mute)">
                {f.answer}
              </p>
            </details>
          ))}
        </div>
      </Section>

      {/* Aprovar */}
      <footer id="aprovar" className="bg-grafite px-6 pb-24 pt-8 text-center text-marfim">
        <div className="mx-auto max-w-3xl rounded-3xl bg-linear-to-br from-bronze to-dourado/80 px-6 py-16">
          <h2 className="mb-3 font-display text-3xl sm:text-4xl">
            Tudo certo com a proposta?
          </h2>
          <p className="mb-8 text-marfim/80">
            Ao aprovar, entro em contato para formalizarmos o contrato.
          </p>
          <ApproveButton />
        </div>
      </footer>
    </main>
  );
}

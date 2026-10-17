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
  toDiscount,
} from "@/lib/proposal-calc";
import { db } from "@/db";
import { bonusDisplayValue } from "@/lib/proposal-bonuses";
import {
  SCOPE_DESCRIPTION,
  SCOPE_OUT_OF_SCOPE_NOTE,
  pagesLabel,
  scopeCounts,
  sectionsLabel,
} from "@/lib/proposal-scope";
import { getOptionalUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ClientCard } from "../_components/client-card";
import { CoverGrid, Sunburst } from "../_components/cover-art";
import { Icon } from "../_components/icons";
import { InviteGate } from "../_components/invite-gate";
import { ReopenInviteButton } from "../_components/reopen-invite-button";
import { PaymentChoice } from "../_components/payment-choice";
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

// Partes do card de Investimento (projeto, bônus, pagamento, plano mensal): divisória + rótulo.
const partDivider = "mt-12 border-t border-grafite/10 pt-12";
const partLabel =
  "text-center text-sm font-semibold uppercase tracking-[0.18em] text-bronze";
const partIntro =
  "mx-auto mt-2 max-w-md text-balance text-center text-base leading-7 text-(--mute)";

type ProposalPageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ convite?: string | string[] }>;
};

// A página em si não espera `params`/`searchParams`: só repassa as promessas. O `await`
// fica em <Proposal>, dentro do Suspense (exigência do cacheComponents).
// Botões da capa: ir direto ao investimento e rever o convite. A capa renderiza o bloco duas vezes
// (abaixo do parágrafo no desktop e abaixo da moldura no mobile); o CSS esconde o que não cabe.
function CoverActions({ className }: { className: string }) {
  return (
    <nav
      className={`flex flex-col gap-3 text-center text-xs lg:flex-row font-semibold uppercase tracking-widest ${className}`}
    >
      <a
        href="#investimento"
        className="whitespace-nowrap rounded-full bg-bronze px-5 py-3 text-marfim transition hover:bg-grafite"
      >
        Ver investimento
      </a>
      <ReopenInviteButton className="cursor-pointer whitespace-nowrap rounded-full border border-grafite/20 px-5 py-3 text-cinza transition hover:border-grafite/40 hover:text-grafite" />
    </nav>
  );
}

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
  await connection();
  const { token } = await params;
  const { convite } = await searchParams;

  // Sempre pelo token, nunca pelo ID. Soft delete filtrado na query.
  const row = await db.query.proposals.findFirst({
    where: { publicToken: token, deletedAt: { isNull: true } },
    with: {
      client: true,
      items: { orderBy: { position: "asc" } },
    },
  });

  // "Não existe" e "é rascunho sem login" respondem igual (404): não revela o token.
  if (!row || !row.client) notFound();
  const user = await getOptionalUser();
  if (row.status === "draft" && !user) notFound();

  // Convite de abertura: só para o cliente (sem sessão) e enquanto não aprovada. O dono
  // abre direto; para testar a animação, ?convite=1 (só vale com sessão, ignora o "já abriu").
  const forceInvite = user !== null && convite === "1";
  const skipInvite = row.status === "approved" || (user !== null && !forceInvite);

  const p = {
    title: row.title,
    clientName: row.client.name,
    clientLogoUrl: row.client.logoUrl,
    bonuses: row.bonuses,
    deliveryDays: row.deliveryDays,
    hostingMonthly: row.hostingMonthly,
    discount: toDiscount(row.discountType, row.discountValue),
    items: row.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: toDiscount(item.discountType, item.discountValue),
      scope: item.scope,
    })),
    fixedContent: row.fixedContent,
  };
  const c = p.fixedContent;

  const subtotal = projectSubtotal(p.items);
  const total = projectTotal(p.items, p.discount);
  const generalDiscount = subtotal - total;
  const [entry, onDelivery] = splitPayment(total);
  const pixSaving = total - pixTotal(total);

  return (
    <InviteGate
      token={token}
      clientName={p.clientName}
      senderName={c.about.name}
      skip={skipInvite}
      force={forceInvite}
    >
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

        <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center px-6 pt-8">
          <p className="font-display text-xl font-bold tracking-tight">
            {c.about.name}
          </p>
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
            {/* desktop: botões abaixo do parágrafo */}
            <CoverActions className="mt-10 hidden lg:flex" />
          </div>
          <div className="lg:flex lg:justify-center">
            <div className="w-full max-w-sm">
              <ClientCard clientName={p.clientName} logoUrl={p.clientLogoUrl} />
              {/* mobile: botões abaixo da moldura flutuante */}
              <CoverActions className="mt-14 lg:hidden" />
            </div>
          </div>
        </div>

        {/* indicador de rolagem (desktop): avisa que a proposta continua abaixo da capa */}
        <a
          href="#sobre"
          aria-label="Rolar para ver a proposta"
          className="absolute inset-x-0 bottom-8 z-10 mx-auto hidden w-fit flex-col items-center gap-1 text-[0.6875rem] font-semibold uppercase tracking-[0.25em] text-cinza transition hover:text-grafite lg:flex"
        >
          Role para ver a proposta
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="animate-scroll-cue size-6 text-(--accent)"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </a>
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
                {p.deliveryDays} {p.deliveryDays === 1 ? "dia útil" : "dias úteis"}
              </p>
              <p className="text-base text-(--mute)">{c.delivery.note}</p>
            </div>
          </div>

          <div>
          <ol className="relative space-y-12 before:absolute before:bottom-4 before:left-4.5 before:top-4 before:w-px before:bg-dourado/50">
            {c.process.steps.map((s, idx) => {
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
                </li>
              );
            })}
          </ol>

          {/* regra das rodadas e nota dos 60 dias, logo abaixo dos passos */}
          <div className="mt-12 space-y-4">
            {c.process.adjustments && (
              <p className="rounded-2xl border border-(--line) px-5 py-4 text-base leading-7 text-(--mute)">
                <Rich text={c.process.adjustments} />
              </p>
            )}
            <p className="rounded-2xl bg-dourado/10 px-5 py-4 text-base leading-7 text-(--mute)">
              {c.delivery.maintenance}
            </p>
          </div>
          </div>
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

            {/* parte 1: o projeto. Serviços numa lista só, com quantidade e desconto no detalhe */}
            <h3 className={`${partLabel} mt-10`}>O projeto</h3>
            <p className={partIntro}>O que será desenvolvido para você e o valor do investimento.</p>
            <ul className="mt-6 space-y-3">
              {p.items.map((item) => {
                const subtotal = itemSubtotal(item);
                const hasDetail = item.quantity > 1 || item.scope !== null;
                const original = item.quantity * item.unitPrice;
                const price = (
                  <span className="flex shrink-0 items-center gap-3 max-[419px]:mx-auto min-[420px]:ml-auto">
                    {item.discount && original > subtotal && (
                      <span className="text-base tabular-nums text-(--mute) line-through">
                        {formatBRL(original)}
                      </span>
                    )}
                    <span
                      className={`${pill} text-lg tabular-nums ${
                        subtotal === 0
                          ? "bg-dourado/25 text-bronze"
                          : "bg-dourado text-[#f3f3f3]" // = bg-grafite/5 sobre o card branco (fundo da pílula do serviço)
                      }`}
                    >
                      {subtotal === 0 ? "Incluso" : formatBRL(subtotal)}
                    </span>
                  </span>
                );

                // Sem detalhe (qtd 1 e sem escopo): linha fixa. Com detalhe (qtd > 1 ou escopo): abre ao clicar na seta.
                return (
                  <li key={item.description}>
                    {hasDetail ? (
                      <details open className="group rounded-3xl bg-grafite/5">
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
                        <div className="space-y-3 px-5 pb-4 pl-12">
                          {item.quantity > 1 && (
                            <p className="text-base text-(--mute)">
                              {`${item.quantity} × ${formatBRL(item.unitPrice)}`}
                            </p>
                          )}
                          {item.scope && (
                            <>
                              <p className="text-base leading-7 text-(--mute)">
                                {SCOPE_DESCRIPTION}
                              </p>
                              {item.scope.pages.length > 0 && (
                                <>
                                  {/* rótulos calculados da lista: páginas e seções */}
                                  <div className="flex flex-wrap gap-2 text-sm font-semibold text-bronze">
                                    <span className="rounded-full bg-dourado/25 px-3 py-1">
                                      {pagesLabel(scopeCounts(item.scope).pages)}
                                    </span>
                                    <span className="rounded-full bg-dourado/25 px-3 py-1">
                                      {sectionsLabel(scopeCounts(item.scope).sections)}
                                    </span>
                                  </div>
                                  <div className="space-y-4">
                                    {item.scope.pages.map((page, pageIndex) => (
                                      <div key={`${pageIndex}-${page.name}`}>
                                        {page.name && (
                                          <p className="mb-1.5 text-base font-semibold">{page.name}</p>
                                        )}
                                        <ul className="space-y-1.5">
                                          {page.sections.map((section) => (
                                            <li key={section} className="flex gap-3 text-base leading-7">
                                              <span
                                                aria-hidden
                                                className="mt-2.5 size-1.5 shrink-0 rounded-full bg-dourado"
                                              />
                                              {section}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}
                              {item.scope.included.length > 0 && (
                                <div className="border-t border-(--line) pt-3">
                                  <p className="mb-2 text-sm font-semibold text-bronze">Incluso no site</p>
                                  <ul className="flex flex-wrap gap-2">
                                    {item.scope.included.map((text) => (
                                      <li
                                        key={text}
                                        className="rounded-full bg-grafite/10 px-3 py-1 text-sm text-(--mute)"
                                      >
                                        {text}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {item.scope.notIncluded.length > 0 && (
                                <div className="border-t border-(--line) pt-3">
                                  <p className="mb-2 text-sm font-semibold text-bronze">Não incluso</p>
                                  <ul className="flex flex-wrap gap-2">
                                    {item.scope.notIncluded.map((text) => (
                                      <li
                                        key={text}
                                        className="rounded-full bg-grafite/10 px-3 py-1 text-sm text-(--mute)"
                                      >
                                        {text}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              <p className="text-sm leading-6 text-(--mute)">{SCOPE_OUT_OF_SCOPE_NOTE}</p>
                            </>
                          )}
                        </div>
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
                  {p.discount?.type === "percentage" && ` (${p.discount.value}%)`}
                  <span className="font-display tabular-nums">
                    − {formatBRL(generalDiscount)}
                  </span>
                </span>
              )}
            </div>

            {/* bônus: mini-seção, um card por bônus */}
            {p.bonuses.length > 0 && (
              <div className={partDivider}>
                <h3 className={partLabel}>Seus bônus</h3>
                <p className={partIntro}>Extras incluídos na sua proposta, sem custo.</p>
                <ul className="mt-6 space-y-3">
                  {p.bonuses.map((bonus) => {
                    const bonusValue = bonusDisplayValue(bonus, p.hostingMonthly);
                    return (
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
                          <span className="min-w-0 flex-1 basis-40 text-balance text-lg font-medium">
                            {bonus.title}
                          </span>
                          <span className="flex shrink-0 items-center gap-3 max-[419px]:mx-auto min-[420px]:ml-auto">
                            {bonusValue !== null && (
                              <span className="text-base tabular-nums text-(--mute) line-through">
                                {formatBRL(bonusValue)}
                              </span>
                            )}
                            <span
                              className={`${pill} bg-dourado/25 text-lg text-bronze`}
                            >
                              Grátis
                            </span>
                          </span>
                        </summary>
                        <p className="px-5 pb-4 pl-12 text-base leading-7 text-(--mute)">
                          {bonus.description}
                        </p>
                      </details>
                    </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* formas de pagamento */}
            <div className={partDivider}>
              <h3 className={partLabel}>Forma de pagamento</h3>
              <p className={partIntro}>{c.payment.intro}</p>
            </div>

            <PaymentChoice
              methods={c.payment.methods}
              total={total}
              pixTotal={pixTotal(total)}
              pixSaving={pixSaving}
              entry={entry}
              onDelivery={onDelivery}
              token={token}
              approved={row.status === "approved"}
              approvedMethod={row.paymentMethod}
              approvedInstallments={row.cardInstallments}
            >
              {/* plano mensal: depois da escolha do pagamento e antes do botão de aprovar; fora do total */}
              {p.hostingMonthly !== null && (
                <div className={partDivider}>
                  <h3 className={partLabel}>Plano mensal</h3>
                  <p className={partIntro}>
                    Hospedagem e manutenção do seu site, cobradas à parte do projeto.
                  </p>
                  {/* linha do tempo: de relance, "agora é grátis, depois é mensal" */}
                  <div className="mt-5 grid grid-cols-1 items-stretch gap-2 sm:grid-cols-[1fr_auto_1fr] sm:gap-3">
                    <div className="flex flex-col items-center justify-center rounded-3xl bg-dourado/25 px-3 py-4 text-center">
                      <p className="text-sm font-medium text-bronze">Primeiros 60 dias</p>
                      <p className="font-display text-3xl font-bold tracking-tight text-bronze">
                        Grátis
                      </p>
                    </div>
                    {/* mobile: seta para baixo (a "→" girada); a partir de sm: para o lado */}
                    <span
                      aria-hidden
                      className="flex rotate-90 items-center justify-center text-2xl text-(--mute) sm:rotate-0"
                    >
                      →
                    </span>
                    <div className="flex flex-col items-center justify-center rounded-3xl bg-grafite/5 px-3 py-4 text-center">
                      <p className="text-sm font-medium text-(--mute)">Depois</p>
                      <p className="font-display text-3xl font-bold tracking-tight tabular-nums">
                        {formatBRL(p.hostingMonthly)}
                        <span className="text-base font-medium text-(--mute)">/mês</span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap justify-center gap-2 text-sm font-semibold text-bronze">
                    <span className="rounded-full bg-dourado/25 px-3 py-1">Nada a pagar agora</span>
                    <span className="rounded-full bg-dourado/25 px-3 py-1">Fora do total do projeto</span>
                  </div>
                </div>
              )}
            </PaymentChoice>
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
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-lg py-6 font-display text-xl leading-snug [&::-webkit-details-marker]:hidden">
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
    </InviteGate>
  );
}

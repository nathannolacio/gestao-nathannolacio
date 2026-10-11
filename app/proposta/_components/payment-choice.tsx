"use client";

import { useState } from "react";
import type { FixedContent } from "@/lib/proposal-content";
import { formatBRL, installmentAmount } from "@/lib/proposal-calc";
import { ApproveButton } from "./approve-button";

type Method = FixedContent["payment"]["methods"][number];
type MethodId = Method["id"];

// Valores já calculados no servidor (em centavos): aqui só formatamos.
type PaymentChoiceProps = {
  methods: Method[];
  total: number;
  pixTotal: number;
  pixSaving: number;
  entry: number;
  onDelivery: number;
};

const pill = "rounded-full px-4 py-1.5 font-display font-semibold";

const MAX_INSTALLMENTS = 10;
const installmentOptions = Array.from({ length: MAX_INSTALLMENTS }, (_, i) => i + 1);

export function PaymentChoice({
  methods,
  total,
  pixTotal,
  pixSaving,
  entry,
  onDelivery,
}: PaymentChoiceProps) {
  // Só visual por enquanto. Na etapa 7 este valor segue para a Server Action
  // de aprovar, que deve validá-lo com Zod (nunca confiar no navegador).
  const [selected, setSelected] = useState<MethodId | null>(null);
  // Só vale quando o método é "card"; começa no máximo (menor parcela).
  const [installments, setInstallments] = useState(MAX_INSTALLMENTS);

  return (
    <>
      <div role="radiogroup" aria-label="Forma de pagamento" className="mt-6 space-y-3">
        {methods.map((m) => {
          const active = selected === m.id;
          const isPix = m.id === "pix";

          return (
            <label
              key={m.id}
              className={`relative block cursor-pointer rounded-3xl border p-5 transition has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-bronze ${
                active
                  ? "border-dourado bg-dourado/15 ring-2 ring-dourado"
                  : isPix
                    ? "border-dourado/40 bg-dourado/10 hover:border-dourado"
                    : "border-transparent bg-grafite/5 hover:border-dourado/50"
              }`}
            >
              <input
                type="radio"
                name="payment-method"
                value={m.id}
                checked={active}
                onChange={() => setSelected(m.id)}
                className="sr-only"
              />

              <span
                aria-hidden
                className={`absolute right-5 top-5 flex size-6 items-center justify-center rounded-full border-2 transition ${
                  active ? "border-dourado bg-dourado" : "border-grafite/25 bg-white"
                }`}
              >
                {active && (
                  <svg viewBox="0 0 24 24" className="size-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                )}
              </span>

              {isPix ? (
                <>
                  <div className="flex flex-wrap gap-2 pr-10">
                    <span className="rounded-full bg-dourado/25 px-3 py-1 text-sm font-semibold text-bronze">
                      Melhor opção
                    </span>
                    <span className="rounded-full bg-bronze px-3 py-1 text-sm font-semibold text-marfim">
                      10% de desconto
                    </span>
                  </div>
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
                        {formatBRL(pixTotal)}
                      </p>
                      <p className="text-base font-medium text-bronze">
                        Você economiza {formatBRL(pixSaving)}
                      </p>
                    </div>
                  </div>
                </>
              ) : m.id === "split" ? (
                <>
                  <p className="pr-10 text-lg font-medium">{m.title}</p>
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
                </>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pr-10">
                    <p className="text-lg font-medium">{m.title}</p>
                    <span className="rounded-full bg-dourado/25 px-3 py-1 text-sm font-semibold text-bronze">
                      até 10x sem juros
                    </span>
                  </div>
                  <p className="text-base text-(--mute)">{m.text}</p>
                  {active && (
                    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-base text-(--mute)">
                      <span>Parcelar em</span>
                      <select
                        aria-label="Número de parcelas"
                        value={installments}
                        onChange={(e) => setInstallments(Number(e.target.value))}
                        className="cursor-pointer rounded-full border border-dourado/40 bg-white px-4 py-1.5 font-display font-semibold text-grafite focus-visible:outline-2 focus-visible:outline-bronze"
                      >
                        {installmentOptions.map((n) => (
                          <option key={n} value={n}>
                            {n}x
                          </option>
                        ))}
                      </select>
                      <span className={`${pill} bg-white text-grafite tabular-nums`}>
                        {installments}x de {formatBRL(installmentAmount(total, installments))}
                      </span>
                    </div>
                  )}
                </>
              )}
            </label>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <ApproveButton disabled={selected === null} />
        <p aria-live="polite" className="h-5 text-sm text-(--mute)">
          {selected === null && "Escolha uma forma de pagamento para aprovar."}
        </p>
      </div>
    </>
  );
}

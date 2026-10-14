export type DiscountType = "percentage" | "fixed";

export type Discount = { type: DiscountType; value: number } | null;

export type ProposalItem = {
  description: string;
  quantity: number;
  unitPrice: number; // centavos
  discount: Discount;
};

// Converte as duas colunas do banco (discountType + discountValue) no formato do
// cálculo. Ambas nulas = sem desconto. Só uma preenchida é dado corrompido: lança
// erro em vez de cobrar um valor errado em silêncio.
export function toDiscount(
  type: DiscountType | null,
  value: number | null,
): Discount {
  if (type === null && value === null) return null;
  if (type === null || value === null) {
    throw new Error("Desconto inconsistente: tipo e valor devem vir juntos.");
  }
  return { type, value };
}

// Percentual: inteiro (10 = 10%). Fixo: centavos.
function applyDiscount(amount: number, discount: Discount): number {
  if (!discount) return amount;
  const off =
    discount.type === "percentage"
      ? Math.round((amount * discount.value) / 100)
      : discount.value;
  return Math.max(amount - off, 0);
}

export function itemSubtotal(item: ProposalItem): number {
  return applyDiscount(item.quantity * item.unitPrice, item.discount);
}

export function projectSubtotal(items: ProposalItem[]): number {
  return items.reduce((sum, item) => sum + itemSubtotal(item), 0);
}

export function projectTotal(items: ProposalItem[], discount: Discount): number {
  return applyDiscount(projectSubtotal(items), discount);
}

// 10% de desconto à vista no Pix, sem float: total * 90 / 100.
export function pixTotal(total: number): number {
  return Math.round((total * 90) / 100);
}

// 50% na entrada + o restante na entrega (a soma sempre fecha o total).
export function splitPayment(total: number): [number, number] {
  const entry = Math.round(total / 2);
  return [entry, total - entry];
}

// Valor de cada parcela no cartão (sem juros), arredondado para centavos.
export function installmentAmount(total: number, installments: number): number {
  return Math.round(total / installments);
}

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

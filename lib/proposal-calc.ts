export type DiscountType = "percent" | "fixed";

export type Discount = { type: DiscountType; value: number } | null;

export type ProposalItem = {
  description: string;
  quantity: number;
  unitPrice: number; // centavos
  discount: Discount;
};

// Percentual: inteiro (10 = 10%). Fixo: centavos.
function applyDiscount(amount: number, discount: Discount): number {
  if (!discount) return amount;
  const off =
    discount.type === "percent"
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

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

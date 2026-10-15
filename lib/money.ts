// Maior valor que cabe em uma coluna integer do Postgres (em centavos).
const MAX_CENTS = 2_147_483_647;

// Converte texto em reais (formato pt-BR) para centavos inteiros, sem passar
// por número decimal (19,99 * 100 em float dá 1998.999...). Devolve null se o
// formato for inválido. Aceita "600", "600,00", "1.500,00", "R$ 19,99", "19,5".
export function parseReaisToCents(input: string): number | null {
  const text = input.replace(/^R\$\s*/i, "").trim();

  // inteiro (com pontos de milhar opcionais) + vírgula e 1 ou 2 casas opcionais
  const match = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/.exec(text);
  if (!match) return null;

  const reais = Number(match[1].replace(/\./g, ""));
  const cents = Number((match[2] ?? "").padEnd(2, "0"));
  const total = reais * 100 + cents;

  return total <= MAX_CENTS ? total : null;
}

// Caminho inverso de parseReaisToCents: centavos → texto de formulário ("1.500,00").
// Só aritmética inteira (sem float) e sem "R$", para preencher inputs na edição.
export function formatCentsAsReais(cents: number): string {
  const reais = Math.floor(cents / 100);
  const rest = String(cents % 100).padStart(2, "0");

  return `${String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${rest}`;
}

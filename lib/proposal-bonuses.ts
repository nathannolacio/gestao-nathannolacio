// Catálogo de bônus: fonte da verdade dos bônus que posso oferecer.
// Na proposta, o navegador manda só os ids marcados; título e descrição são
// copiados daqui pelo servidor para proposals.bonuses (a "foto" da proposta).
// Os ids são estáveis: nunca renomear um id já usado em propostas salvas.
// (O de hospedagem e manutenção foi renomeado em 14/10/2026, antes de existir proposta real.)
// `value` (centavos) é o valor agregado exibido riscado, com o selo "Grátis".
// É só referência de percepção: o bônus não é cobrado e nunca entra no total.

export const bonusCatalog = [
  {
    id: "google-meu-negocio",
    title: "Configuração do Google Meu Negócio",
    value: 15000,
    description:
      "Criação e configuração do perfil da sua empresa no Google. Assim, quando alguém pesquisar pelo seu nome ou pelo seu serviço na região, sua empresa aparece no Google e no Google Maps, com endereço, telefone, horário de funcionamento, fotos e o link para o seu site.",
  },
  {
    id: "painel-metricas",
    title: "Painel de métricas",
    value: 20000,
    description:
      "Painel simples, acessível pelo celular ou computador, para você acompanhar o desempenho do seu site: quantas pessoas visitaram, de onde vieram, quais páginas mais acessaram e quantas clicaram para entrar em contato.",
  },
  {
    id: "hospedagem-manutencao-60-dias",
    // O id continua "60-dias" de propósito: ids já usados em propostas salvas nunca mudam.
    // Desde 02/11/2026 a cortesia é de 30 dias (título e descrição abaixo).
    title: "30 dias de hospedagem e manutenção",
    value: 0, // não usado: o valor é 1 × mensalidade da proposta, calculado na exibição (bonusDisplayValue)
    description:
      "Hospedagem e acompanhamento do site no primeiro mês após a publicação: site no ar com segurança, monitoramento do funcionamento, correção de qualquer problema e até 4 alterações, como troca de textos, fotos, preço, telefone ou endereço.",
  },
] as const;

export type BonusId = (typeof bonusCatalog)[number]["id"];

// Bônus que entra em TODA proposta, sem opção de tirar: os textos fixos da página
// (vantagens, processo, FAQ) prometem os 30 dias de hospedagem e manutenção a todos.
// O servidor inclui estes ids mesmo que o navegador não os envie.
const requiredBonusIds: readonly BonusId[] = ["hospedagem-manutencao-60-dias"];

export function isRequiredBonus(id: string): boolean {
  return (requiredBonusIds as readonly string[]).includes(id);
}

// Valor exibido riscado. O bônus de hospedagem vale 1 mês da mensalidade DA PROPOSTA
// (variável), então é calculado aqui e não guardado. Sem mensalidade (cliente com
// hospedagem própria) devolve null: a página não mostra valor riscado.
export function bonusDisplayValue(
  bonus: { id: string; value: number },
  hostingMonthly: number | null,
): number | null {
  if (bonus.id !== "hospedagem-manutencao-60-dias") return bonus.value;
  return hostingMonthly === null ? null : hostingMonthly;
}

// Formato salvo na proposta (cópia do catálogo no momento da criação).
export type ProposalBonus = {
  id: BonusId;
  title: string;
  description: string;
  value: number; // centavos
};

// Tupla com os ids, pronta para z.enum([...]) na validação.
export const bonusIds = bonusCatalog.map((b) => b.id) as [BonusId, ...BonusId[]];

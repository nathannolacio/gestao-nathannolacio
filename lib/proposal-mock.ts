import { defaultFixedContent, type FixedContent } from "./proposal-content";
import type { Discount, ProposalItem } from "./proposal-calc";

// Dados falsos só para desenhar a página. Substituído pela leitura do banco
// quando a etapa 6 (página pública) for ligada ao Drizzle.
export type Bonus = {
  title: string;
  description: string; // resumo que aparece ao abrir o card
};

export type ProposalView = {
  title: string;
  clientName: string;
  aboutProject: string;
  bonuses: Bonus[]; // um card por bônus; lista vazia = sem bônus
  deliveryDays: number;
  hostingAnnual: number | null; // centavos, cobrado uma vez por ano
  discount: Discount;
  items: ProposalItem[];
  fixedContent: FixedContent;
  status: "draft" | "sent" | "approved";
  approvedAt: Date | null;
};

export const mockProposal: ProposalView = {
  title: "Site institucional",
  clientName: "Empresa Exemplo Ltda",
  aboutProject:
    "Você precisa de um *site institucional moderno que apresente a empresa, seus serviços e facilite o contato de novos clientes*.\n\nSerá entregue um site responsivo com 5 páginas, formulário de contato integrado ao WhatsApp e otimização básica para o Google.",
  bonuses: [
    {
      title: "Configuração do Google Meu Negócio",
      description:
        "Configuro o perfil da sua empresa no Google para ela aparecer no Google Maps e nas pesquisas da sua região, com endereço, horário de atendimento, fotos e formas de contato.",
    },
    {
      title: "1 mês de acompanhamento de métricas",
      description:
        "No primeiro mês depois da entrega, acompanho os acessos e as ações dos visitantes no site e te explico, de forma simples, o que os números mostram.",
    },
    {
      title: "SEO básico",
      description:
        "Ajustes para o seu site ser encontrado no Google: títulos, descrições e estrutura das páginas pensados para as buscas.",
    },
  ],
  deliveryDays: 20,
  hostingAnnual: 60000,
  discount: { type: "fixed", value: 50000 },
  items: [
    {
      description: "Site institucional (5 páginas)",
      quantity: 1,
      unitPrice: 250000,
      discount: null,
    },
  ],
  fixedContent: defaultFixedContent,
  status: "sent",
  approvedAt: null,
};

// ---- Dados de pior caso (só dev): servem de teste de regressão da página. ----
// Escolhidos por `?data=worst|one|empty` na URL; em produção nada disso é usado.
const worstProposal: ProposalView = {
  ...mockProposal,
  bonuses: [
    {
      title: "Configuração do Google Meu Negócio",
      description: "Perfil da empresa no Google Maps e nas pesquisas da região.",
    },
    {
      title: "Criação de 3 perfis em redes sociais com identidade visual padronizada",
      description:
        "Crio e configuro três perfis (por exemplo Instagram, Facebook e LinkedIn) com foto, capa e descrição no mesmo padrão visual da sua marca, para a empresa ter presença consistente em todos os canais onde os clientes procuram.",
    },
    {
      title: "1 mês de acompanhamento de métricas",
      description: "Acompanho os acessos do site no primeiro mês.",
    },
    {
      title:
        "Sessão de treinamento gravada para a sua equipe sobre como atualizar o conteúdo do site sem ajuda",
      description:
        "Gravo um passo a passo para a sua equipe atualizar textos e imagens do site sozinha.",
    },
  ],
  deliveryDays: 180,
  hostingAnnual: 1299000,
  discount: { type: "percent", value: 8 },
  items: [
    {
      description:
        "Plataforma web de agendamento online com painel administrativo, integração de pagamento e relatórios gerenciais",
      quantity: 1,
      unitPrice: 1285000,
      discount: null,
    },
    {
      description:
        "Sistema sob medida de gestão de pedidos (módulo de estoque e emissão de notas fiscais)",
      quantity: 1,
      unitPrice: 4850000,
      discount: { type: "fixed", value: 500000 },
    },
    {
      description: "Landing page de campanha",
      quantity: 12,
      unitPrice: 89000,
      discount: { type: "percent", value: 15 },
    },
    {
      description: "Integração com WhatsApp Business API",
      quantity: 1,
      unitPrice: 150000,
      discount: { type: "percent", value: 100 },
    },
    {
      description:
        "Implementação-de-SEO-técnico-e-otimização-de-performance-Core-Web-Vitals",
      quantity: 1,
      unitPrice: 40000,
      discount: null,
    },
    { description: "SEO", quantity: 1, unitPrice: 40000, discount: null },
    { description: "Treinamento da equipe", quantity: 1, unitPrice: 0, discount: null },
    {
      description: "Manutenção evolutiva (bloco de 10 horas)",
      quantity: 2,
      unitPrice: 30000,
      discount: { type: "fixed", value: 90000 },
    },
    { description: "Página adicional", quantity: 1, unitPrice: 35000, discount: null },
    { description: "Blog com painel de edição", quantity: 1, unitPrice: 120000, discount: null },
    { description: "Chat com atendimento", quantity: 1, unitPrice: 60000, discount: null },
    { description: "Certificado SSL e backups", quantity: 1, unitPrice: 25000, discount: null },
  ],
};

const oneProposal: ProposalView = {
  ...mockProposal,
  bonuses: [],
  deliveryDays: 1,
  hostingAnnual: null,
  discount: null,
  items: [
    { description: "Landing page", quantity: 1, unitPrice: 150000, discount: null },
  ],
};

const emptyProposal: ProposalView = {
  ...mockProposal,
  bonuses: [],
  hostingAnnual: null,
  discount: null,
  items: [],
};

const devFixtures: Record<string, ProposalView> = {
  worst: worstProposal,
  one: oneProposal,
  empty: emptyProposal,
};

export const devDataStates = ["demo", "worst", "one", "empty"] as const;

export function getMockProposal(state?: string): ProposalView {
  if (process.env.NODE_ENV === "production") return mockProposal;
  return (state && devFixtures[state]) || mockProposal;
}

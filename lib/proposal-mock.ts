import { defaultFixedContent, type FixedContent } from "./proposal-content";
import type { Discount, ProposalItem } from "./proposal-calc";

// Dados falsos só para desenhar a página. Substituído pela leitura do banco
// quando a etapa 6 (página pública) for ligada ao Drizzle.
export type ProposalView = {
  title: string;
  clientName: string;
  aboutProject: string;
  bonus: string | null;
  deliveryDays: number;
  hostingMonthly: number | null; // centavos
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
  bonus: "Configuração do Google Meu Negócio e 1 mês de acompanhamento de métricas.",
  deliveryDays: 20,
  hostingMonthly: 4900,
  discount: { type: "fixed", value: 20000 },
  items: [
    {
      description: "Site institucional (5 páginas)",
      quantity: 1,
      unitPrice: 250000,
      discount: null,
    },
    {
      description: "Formulário de contato com WhatsApp",
      quantity: 1,
      unitPrice: 30000,
      discount: { type: "percent", value: 10 },
    },
    {
      description: "Otimização SEO básica",
      quantity: 1,
      unitPrice: 40000,
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
  bonus:
    "Configuração do Google Meu Negócio, criação de 3 perfis em redes sociais com identidade visual padronizada, 1 mês de acompanhamento de métricas e uma sessão de treinamento gravada para a sua equipe sobre como atualizar o conteúdo do site sem ajuda.",
  deliveryDays: 180,
  hostingMonthly: 129900,
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
  bonus: null,
  deliveryDays: 1,
  hostingMonthly: null,
  discount: null,
  items: [
    { description: "Landing page", quantity: 1, unitPrice: 150000, discount: null },
  ],
};

const emptyProposal: ProposalView = {
  ...mockProposal,
  bonus: null,
  hostingMonthly: null,
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

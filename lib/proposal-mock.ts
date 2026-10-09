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

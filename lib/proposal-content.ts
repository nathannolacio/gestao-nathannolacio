// Convenção nos textos: *palavra* = destaque (cor dourada nos títulos,
// negrito nos parágrafos). Veja app/proposta/_components/rich.tsx.
// Textos FIXOS da proposta (o que vai para proposal_template.content e,
// copiado, para proposals.fixed_content). Edite os textos aqui até ficarem
// bons; só depois vamos para o seed.

export type FixedContent = {
  about: { title: string; name: string; role: string; paragraphs: string[] };
  advantages: {
    title: string;
    intro: string;
    items: {
      icon: "chat" | "layout" | "bolt" | "shield";
      title: string;
      text: string;
    }[];
  };
  portfolio: {
    title: string;
    intro: string;
    projects: { name: string; description: string; url?: string }[];
  };
  process: {
    title: string;
    steps: { title: string; text: string; note?: string }[];
  };
  payment: {
    title: string;
    intro: string;
    methods: { id: "pix" | "split" | "card"; title: string; text: string }[];
  };
  delivery: { note: string; maintenance: string };
  faq: { title: string; items: { question: string; answer: string }[] };
};

export const defaultFixedContent: FixedContent = {
  about: {
    title: "Mente por trás do projeto",
    name: "Nathan Nolácio",
    role: "Desenvolvedor e prestador de serviços de tecnologia",
    paragraphs: [
      "Prazer, sou o Nathan. Crio sites institucionais, landing pages e sistemas sob medida para negócios que querem se posicionar melhor e *vender mais na internet*.",
      "Trabalho de forma direta, sem intermediários: você fala comigo do primeiro contato até a entrega e o *suporte depois dela*.",
    ],
  },
  advantages: {
    title: "Por que *trabalhar comigo*",
    intro:
      "Aqui você tem um projeto pensado *do começo ao fim* por quem vai colocar a mão na massa, com clareza, prazo e suporte depois da entrega.",
    items: [
      {
        icon: "chat",
        title: "Atendimento direto",
        text: "Sem agência no meio. Você conversa com quem realmente desenvolve o projeto.",
      },
      {
        icon: "layout",
        title: "Sob medida",
        text: "Nada de template genérico: o projeto é pensado para o seu negócio e o seu público.",
      },
      {
        icon: "bolt",
        title: "Rápido e performático",
        text: "Sites leves, responsivos e otimizados para carregar rápido em qualquer dispositivo.",
      },
      {
        icon: "shield",
        title: "Suporte pós-entrega",
        text: "60 dias de manutenção gratuita após a entrega para ajustes e dúvidas.",
      },
    ],
  },
  portfolio: {
    title: "Veja na prática alguns *projetos recentes*",
    intro: "Alguns projetos que desenvolvi recentemente.",
    projects: [
      {
        name: "Projeto exemplo 1",
        description: "Descrição curta do projeto e do resultado entregue.",
        url: "https://exemplo.com",
      },
      {
        name: "Projeto exemplo 2",
        description: "Descrição curta do projeto e do resultado entregue.",
      },
    ],
  },
  process: {
    title: "Entenda o processo de *desenvolvimento* do seu projeto",
    steps: [
      {
        title: "Alinhamento",
        text: "Entendo seu negócio, objetivos e referências para definir o escopo.",
        note: "Aqui acontecem algumas reuniões",
      },
      {
        title: "Design",
        text: "Defino a identidade visual e a estrutura das páginas para sua aprovação.",
        note: "Primeiras impressões",
      },
      {
        title: "Desenvolvimento",
        text: "Construo o projeto com acompanhamento, mostrando o progresso.",
      },
      {
        title: "Revisão",
        text: "Você testa, pede ajustes e validamos tudo juntos.",
      },
      {
        title: "Entrega",
        text: "Publico o projeto no ar e passo todas as orientações de uso.",
      },
    ],
  },
  payment: {
    title: "Formas de *pagamento*",
    intro: "Formas de pagamento disponíveis (informativo; combinamos juntos na aprovação).",
    methods: [
      {
        id: "pix",
        title: "Integral (à vista no Pix)",
        text: "100% à vista no Pix, com 10% de desconto.",
      },
      {
        id: "split",
        title: "Em duas parcelas",
        text: "50% na entrada e 50% na entrega do projeto.",
      },
      {
        id: "card",
        title: "Cartão de crédito",
        text: "Parcelado no cartão. Número de parcelas a definir.",
      },
    ],
  },
  delivery: {
    note: "A partir da entrega dos materiais.",
    maintenance:
      "Após a entrega, você conta com 60 dias de manutenção gratuita. Depois desse período, ajustes e manutenções são contratados de forma avulsa.",
  },

  faq: {
    title: "*Perguntas* frequentes",
    items: [
      {
        question: "Está incluso o registro de domínio e a hospedagem?",
        answer:
          "O domínio é contratado por você, e eu te oriento no passo a passo. A hospedagem pode ser contratada por você ou comigo, em valor mensal à parte (quando aparece na seção de investimento).",
      },
      {
        question: "Posso pedir alterações no layout?",
        answer:
          "Sim. Os ajustes combinados durante o processo fazem parte do projeto. Mudanças que exijam refazer o design depois de aprovado são orçadas à parte.",
      },
      {
        question: "E se eu quiser adicionar novas páginas ou funcionalidades depois?",
        answer:
          "Sem problemas. Novos serviços viram uma proposta nova, com escopo e valor próprios.",
      },
      {
        question: "Como funciona o suporte depois da entrega?",
        answer:
          "Você tem 60 dias de manutenção gratuita após a entrega. Depois disso, a manutenção é avulsa.",
      },
    ],
  },
};

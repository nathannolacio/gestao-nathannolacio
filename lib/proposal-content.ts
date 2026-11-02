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
    projects: {
      name: string;
      description: string;
      image?: string; // capa: aparece enquanto o vídeo carrega
      video?: string; // gravação da página rolando (mp4 em public/)
    }[];
  };
  process: {
    title: string;
    steps: { title: string; text: string; note?: string }[];
    // Regra das rodadas de ajustes, logo abaixo dos passos. Opcional: cópias antigas não têm.
    adjustments?: string;
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
    title: "Quem vai *cuidar do seu projeto*",
    name: "Nathan Nolacio",
    role: "Desenvolvedor e prestador de serviços de tecnologia",
    paragraphs: [
      "Sou o Nathan. Desenvolvo sites, landing pages e sistemas sob medida para negócios que querem *ser encontrados, bem avaliados e escolhidos* na internet.",
      "Aqui não tem intermediário. Você fala comigo do primeiro contato até a entrega, e *continua tendo suporte depois dela*.",
    ],
  },
  advantages: {
    title: "Por que *trabalhar comigo*",
    intro:
      "Cada projeto é pensado *de ponta a ponta* por quem vai desenvolvê-lo, com clareza, prazo definido e suporte depois do lançamento.",
    items: [
      {
        icon: "chat",
        title: "Atendimento direto",
        text: "Sem agência no meio. Você conversa com quem realmente faz o projeto.",
      },
      {
        icon: "layout",
        title: "Feito sob medida",
        text: "Nada de template genérico. O visual e a estrutura nascem do seu negócio e do seu público.",
      },
      {
        icon: "bolt",
        title: "Rápido e leve",
        text: "Páginas responsivas, que carregam depressa e funcionam bem no celular.",
      },
      {
        icon: "shield",
        title: "Suporte depois da entrega",
        text: "30 dias de hospedagem e manutenção grátis depois da publicação, para ajustes e dúvidas.",
      },
    ],
  },
  portfolio: {
    title: "Veja *como isso funciona na prática*",
    intro: "Dois projetos recentes, no ar e em uso.",
    projects: [
      {
        name: "Método Florescer",
        description:
          "Landing page de venda de e-book de educação financeira para mães.",
        image: "/proposta/projeto-florescer.jpg",
        video: "/proposta/projeto-florescer.mp4",
      },
      {
        name: "Maria Reis · Terapia TRG",
        description:
          "Site institucional com atendimento online e agendamento de sessão.",
        image: "/proposta/projeto-maria-reis.jpg",
        video: "/proposta/projeto-mariareis.mp4",
      },
    ],
  },
  process: {
    title: "Da aprovação ao *site no ar*",
    steps: [
      {
        title: "Início",
        text: "Assinamos o contrato, você faz o pagamento, preenche o briefing e me envia o material: textos, fotos, logo e acessos. O prazo começa a contar a partir daqui.",
        note: "Contrato, briefing e material",
      },
      {
        title: "Layout",
        text: "Defino o visual e a estrutura das seções e apresento o layout. Se partirmos da prévia que já te mostrei, ela é o layout. Você aprova antes de eu construir.",
        note: "Etapa 1 · até 2 rodadas de ajustes",
      },
      {
        title: "Desenvolvimento",
        text: "Construo o site conforme o layout aprovado e te mostro em um link de teste para revisar.",
        note: "Etapa 2 · até 2 rodadas de ajustes",
      },
      {
        title: "Entrega",
        text: "Coloco o site no ar, explico como usar e começam os seus 30 dias de hospedagem e manutenção grátis.",
        note: "Site publicado · 30 dias grátis",
      },
    ],
    adjustments:
      "*Como funcionam os ajustes:* em cada etapa, você envia uma lista única com tudo o que quer ajustar. Cada lista conta como uma rodada.",
  },
  payment: {
    title: "Formas de *pagamento*",
    intro: "Opções para você investir da forma que ficar melhor.",
    methods: [
      {
        id: "pix",
        title: "Integral (à vista no Pix)",
        text: "Pagamento de 100% à vista no Pix.",
      },
      {
        id: "split",
        title: "Em duas parcelas",
        text: "50% na entrada e 50% na entrega do projeto.",
      },
      {
        id: "card",
        title: "Cartão de crédito",
        text: "Parcelamento no cartão de crédito.",
      },
    ],
  },
  delivery: {
    note: "Em dias úteis, contados a partir do recebimento do briefing e dos materiais. O tempo que você leva para responder não conta no prazo.",
    maintenance:
      "Depois da publicação, você tem 30 dias de hospedagem e manutenção grátis, com até 4 alterações por mês. Depois disso, o plano mensal (hospedagem e manutenção) começa automaticamente. Se preferir não continuar, é só avisar até 10 dias antes e eu te entrego os arquivos do site.",
  },

  faq: {
    title: "Perguntas *frequentes*",
    items: [
      {
        question: "Domínio e hospedagem estão inclusos?",
        answer:
          "O domínio fica no seu nome: você contrata (cerca de R$ 40 por ano no Registro.br) e eu te guio no passo a passo. Os primeiros 30 dias de hospedagem e manutenção são grátis; depois, o plano mensal aparece no investimento. Se preferir hospedar por conta própria, eu te entrego os arquivos do site.",
      },
      {
        question: "Posso pedir alterações no layout?",
        answer:
          "Pode. Cada etapa (layout e site desenvolvido) inclui até 2 rodadas de ajustes, e cada rodada é uma lista única e consolidada de solicitações. Refazer um layout já aprovado é orçado à parte.",
      },
      {
        question: "E se eu quiser novas páginas ou funcionalidades depois?",
        answer:
          "Sem problema. A manutenção já está incluída no plano; só páginas, seções e funcionalidades novas são cobradas à parte, cada uma em uma proposta própria, com escopo e valor claros.",
      },
      {
        question: "Como funciona o suporte depois da entrega?",
        answer:
          "São 30 dias de hospedagem e manutenção grátis, com até 4 alterações por mês. Alteração é uma troca pontual de até 15 minutos, como texto, foto, preço, telefone ou endereço, atendida em até 3 dias úteis. Seção, página ou layout novo é orçado à parte. Depois dos 30 dias, o plano mensal mantém o site no ar com as mesmas 4 alterações por mês.",
      },
      {
        question: "Em quanto tempo você responde?",
        answer: "Respondo suas mensagens em até 1 dia útil.",
      },
    ],
  },
};

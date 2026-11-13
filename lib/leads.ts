// Regras e textos do módulo de Leads, compartilhados por telas, actions e Zod.
// O banco guarda os códigos em inglês; a tela mostra em português (igual ao status da proposta).
// Atenção: este arquivo é importado (só tipo) por db/schema.ts, então nada de alias "@/" aqui.

export const leadStages = ["new", "contacted", "talking", "diagnosis", "proposal", "won", "lost"] as const;
export type LeadStage = (typeof leadStages)[number];

export const leadStageLabel: Record<LeadStage, string> = {
    new: "Novo",
    contacted: "Contatado",
    talking: "Em conversa",
    diagnosis: "Diagnóstico",
    proposal: "Proposta enviada",
    won: "Ganho",
    lost: "Perdido",
};

// Estágios em que o lead ainda pede ação (têm follow-up). Ganho e perdido encerram.
export const openLeadStages = ["new", "contacted", "talking", "diagnosis", "proposal"] as const satisfies readonly LeadStage[];

export function isOpenStage(stage: LeadStage) {
    return (openLeadStages as readonly LeadStage[]).includes(stage);
}

export const leadSources = ["prospecting", "referral", "instagram", "google", "site", "other"] as const;
export type LeadSource = (typeof leadSources)[number];

export const leadSourceLabel: Record<LeadSource, string> = {
    prospecting: "Prospecção ativa",
    referral: "Indicação",
    instagram: "Instagram",
    google: "Google",
    site: "Site",
    other: "Outro",
};

export const contactChannels = ["whatsapp", "call", "email", "dm", "in_person"] as const;
export type ContactChannel = (typeof contactChannels)[number];

export const contactChannelLabel: Record<ContactChannel, string> = {
    whatsapp: "WhatsApp",
    call: "Ligação",
    email: "E-mail",
    dm: "DM no Instagram",
    in_person: "Presencial",
};

// Roteiro da reunião de diagnóstico (15 a 20 min). As respostas ficam em `leads.diagnosis`
// pelo id da pergunta; trocar o TEXTO de uma pergunta não perde respostas, trocar o ID perde.
export const diagnosisQuestions = [
    { id: "como-encontram", text: "Como os clientes encontram você hoje?" },
    { id: "o-que-usa", text: "O que você já usa (Instagram, site, WhatsApp Business, cardápio em PDF, planilha...)?" },
    { id: "dor", text: "O que mais toma seu tempo ou faz você perder venda no atendimento?" },
    { id: "objetivo", text: "Qual é o objetivo principal: mais clientes, passar credibilidade, receber pedidos ou se organizar?" },
    { id: "materiais", text: "Já tem domínio, logo, fotos e textos? Quem vai mandar o conteúdo?" },
    { id: "prazo", text: "Tem alguma data ou prazo importante?" },
    { id: "decisao", text: "Quem decide e quanto pensou em investir?" },
] as const;

export type DiagnosisQuestionId = (typeof diagnosisQuestions)[number]["id"];
export type LeadDiagnosis = Partial<Record<DiagnosisQuestionId, string>>;

// ---------------------------------------------------------------------------
// Datas: o follow-up é uma DATA (sem hora), no fuso de São Paulo, como texto "AAAA-MM-DD".
// Comparar texto nesse formato equivale a comparar datas, sem armadilha de fuso.
// ---------------------------------------------------------------------------

const TIME_ZONE = "America/Sao_Paulo";

// "Hoje" em São Paulo (o servidor da Vercel roda em UTC: às 22h daqui já é amanhã lá).
export function todayInSaoPaulo(now = new Date()) {
    // en-CA formata como AAAA-MM-DD.
    return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);
}

// Soma dias corridos a uma data "AAAA-MM-DD" (meio-dia UTC para não escorregar de dia).
export function addDays(isoDate: string, days: number) {
    const date = new Date(`${isoDate}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
}

// Diferença em dias entre duas datas "AAAA-MM-DD" (b − a).
export function daysBetween(a: string, b: string) {
    const ms = Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`);
    return Math.round(ms / 86_400_000);
}

// "AAAA-MM-DD" → "dd/mm".
export function formatShortDate(isoDate: string) {
    const [, month, day] = isoDate.split("-");
    return `${day}/${month}`;
}

// Texto curto do follow-up relativo a hoje: "Hoje", "Amanhã", "Atrasado 3 dias", "12/11".
export function followUpLabel(isoDate: string, today: string) {
    const diff = daysBetween(today, isoDate);
    if (diff === 0) return "Hoje";
    if (diff === 1) return "Amanhã";
    if (diff < 0) return diff === -1 ? "Atrasado 1 dia" : `Atrasado ${-diff} dias`;
    return formatShortDate(isoDate);
}

// Telefone salvo só com dígitos (DDI + DDD + número): mostra no formato brasileiro.
export function formatPhone(digits: string) {
    const local = digits.startsWith("55") && digits.length > 11 ? digits.slice(2) : digits;
    const match = /^(\d{2})(\d{4,5})(\d{4})$/.exec(local);
    return match ? `(${match[1]}) ${match[2]}-${match[3]}` : digits;
}

// Link do WhatsApp (abre a conversa no app ou no WhatsApp Web).
export function whatsappUrl(phoneDigits: string, message?: string) {
    const base = `https://wa.me/${phoneDigits}`;
    return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

// ---------------------------------------------------------------------------
// Prospecção: nota A/B/C e mensagem pronta da primeira abordagem.
// ---------------------------------------------------------------------------

export const leadPriorities = ["A", "B", "C"] as const;
export type LeadPriority = (typeof leadPriorities)[number];

export const leadPriorityHint: Record<LeadPriority, string> = {
    A: "Fala com o dono e é ativo: recebe prévia própria",
    B: "Fala com o dono, mas pouco ativo ou com equipe: recebe a demo do nicho",
    C: "Fixo, recepção ou já atendido: só se sobrar tempo",
};

// Ordem de abordagem: A primeiro, sem nota por último.
export function priorityRank(priority: LeadPriority | null) {
    return priority === null ? leadPriorities.length : leadPriorities.indexOf(priority);
}

export type MessageLead = {
    businessName: string;
    contactName: string | null;
    hook: string | null;
    previewUrl: string | null;
};

// Oferta da abordagem: site one-page ou cardápio digital (food). Não fica salva no lead: a tela sugere pelo
// segmento (`suggestOffer`) e você troca na hora, se precisar.
export const messageOffers = ["site", "menu"] as const;
export type MessageOffer = (typeof messageOffers)[number];
export const messageOfferLabel: Record<MessageOffer, string> = { site: "Site", menu: "Cardápio" };

// Segmentos de comida que costumam pedir cardápio (comparados sem acento e em minúsculas).
const foodSegments = [
    "doce", "doceria", "confeitaria", "bolo", "marmita", "marmitaria", "hamburguer", "hamburgueria", "lanche",
    "lanchonete", "pizza", "pizzaria", "acai", "restaurante", "comida", "esfiha", "pastel", "sorvete",
    "sorveteria", "padaria", "cafeteria", "food", "salgado", "japones", "sushi", "churrasco", "espetinho",
];

export function suggestOffer(segment: string | null): MessageOffer {
    if (!segment) return "site";
    const text = segment.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return foodSegments.some((word) => text.includes(word)) ? "menu" : "site";
}

// Texto da 1ª mensagem (modelos do doc "Prospecção com prévias"): com prévia = modelo do lead A;
// sem prévia = modelo do lead B, que termina oferecendo a prévia. Cada um em versão site e cardápio.
// O texto abre editável na tela antes do envio.
export function firstMessage(lead: MessageLead, offer: MessageOffer = "site") {
    const greeting = lead.contactName ? `Oi, ${lead.contactName}, tudo bem?` : "Oi, tudo bem?";
    const hook = lead.hook ? ` ${lead.hook}` : "";
    const optOut = "O que achou? Se não for o momento, é só me falar que eu não mando mais mensagem.";

    if (offer === "menu") {
        if (lead.previewUrl) {
            return [
                `${greeting} Aqui é o Nathan, de Caieiras. Faço cardápios digitais para negócios da região e montei uma prévia de como ficaria o cardápio da ${lead.businessName}: ${lead.previewUrl}`,
                `Usei o nome, as cores e as fotos do Instagram de vocês. Os itens e preços são de exemplo.${hook}`,
                optOut,
            ].join("\n\n");
        }
        return [
            `${greeting} Aqui é o Nathan, de Caieiras. Faço cardápios digitais para negócios da região: o cliente vê os produtos com foto e preço e manda o pedido pronto no WhatsApp.`,
            `Faço um com o nome, as cores e as fotos da ${lead.businessName}.${hook}`,
            "Quer que eu monte uma prévia com a cara de vocês? Sem compromisso.",
        ].join("\n\n");
    }

    if (lead.previewUrl) {
        return [
            `${greeting} Aqui é o Nathan, de Caieiras. Faço sites para negócios da região e montei uma prévia de como ficaria o site da ${lead.businessName}: ${lead.previewUrl}`,
            `Usei o nome, as cores e as fotos do Instagram de vocês. Os textos são de exemplo.${hook}`,
            optOut,
        ].join("\n\n");
    }

    return [
        `${greeting} Aqui é o Nathan, de Caieiras. Faço sites para negócios da região.`,
        `Faço um com o nome, as cores e as fotos da ${lead.businessName}.${hook}`,
        "Quer que eu monte uma prévia com a cara de vocês? Sem compromisso.",
    ].join("\n\n");
}

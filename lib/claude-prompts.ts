// Prompts prontos para as etapas feitas FORA do sistema, com o Claude (projeto "Soluções Digitais").
// O botão copia o texto e abre o projeto: lá o Claude já conhece nicho, preços, pacotes e método,
// então o prompt só precisa levar os dados do lead.
// Imports relativos com .ts: o arquivo pode ser lido por scripts fora do Next.

import { diagnosisQuestions, type LeadDiagnosis } from "./leads.ts";

// Link do projeto no Claude. Trocar pela variável de ambiente se o projeto mudar.
export const CLAUDE_PROJECT_URL =
    process.env.NEXT_PUBLIC_CLAUDE_PROJECT_URL ?? "https://claude.ai/code/project/chan_01JGeVFQLP5XSkQgUkY2B8Kk";

// Endereço público do sistema (para o link da proposta dentro do prompt).
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gestao-nathannolacio.vercel.app";

type PromptLead = {
    businessName: string;
    contactName: string | null;
    segment: string | null;
    city: string | null;
    instagram: string | null;
    mapsUrl: string | null;
    previewUrl: string | null;
    hook: string | null;
    notes: string | null;
};

function leadBlock(lead: PromptLead) {
    return [
        `- Negócio: ${lead.businessName}`,
        lead.contactName && `- Contato: ${lead.contactName}`,
        lead.segment && `- Segmento: ${lead.segment}`,
        lead.city && `- Cidade: ${lead.city}`,
        lead.instagram && `- Instagram: https://instagram.com/${lead.instagram}`,
        lead.mapsUrl && `- Google Maps: ${lead.mapsUrl}`,
        lead.previewUrl && `- Prévia já feita: ${lead.previewUrl}`,
        lead.hook && `- Gancho da abordagem: ${lead.hook}`,
        lead.notes && `- Observações: ${lead.notes}`,
    ]
        .filter(Boolean)
        .join("\n");
}

function diagnosisBlock(diagnosis: LeadDiagnosis | null) {
    const lines = diagnosisQuestions
        .filter((q) => diagnosis?.[q.id]?.trim())
        .map((q) => `- ${q.text}\n  ${diagnosis![q.id]!.trim()}`);
    return lines.length > 0 ? lines.join("\n") : "- (diagnóstico ainda não respondido)";
}

// Etapa "Abordar" (lead A): prévia do site one-page. Começa com /site-rapido para acionar a skill do Nathan
// (entrada dela: nome, Instagram e Google Maps do negócio).
export function previewPrompt(lead: PromptLead) {
    return `/site-rapido
[Sistema de gestão · etapa Abordar] Gere a prévia do site one-page deste lead seguindo a skill site-rapido.

${leadBlock(lead)}

No fim, além do que a skill entrega, me devolva o link da prévia publicada numa linha separada, para eu colar no campo "Prévia" do lead no sistema.`;
}

// Etapa "Diagnóstico": montar a proposta a partir das respostas.
export function proposalPrompt(lead: PromptLead, diagnosis: LeadDiagnosis | null) {
    return `[Sistema de gestão · etapa Diagnóstico → Proposta] Monte a proposta deste lead com base no diagnóstico.

${leadBlock(lead)}

Respostas do diagnóstico:
${diagnosisBlock(diagnosis)}

Quero:
1. Qual pacote faz sentido (Essencial / Profissional / Premium) e por quê, coerente com a minha tabela e as condições atuais.
2. Os itens da proposta como vou cadastrar no sistema: descrição, quantidade, valor unitário, prazo em dias e hospedagem/manutenção mensal.
3. A mensagem de WhatsApp para enviar o link da proposta (curta, com a validade de 7 dias).
Aponte se algo do diagnóstico for risco (escopo aberto, prazo apertado, decisor ausente).`;
}

type PromptContact = { channel: string; note: string | null; date: string };

// Etapas de follow-up: próxima mensagem a partir do histórico.
export function followUpPrompt(lead: PromptLead, stageLabel: string, contacts: PromptContact[]) {
    const history =
        contacts.length > 0
            ? contacts.map((c) => `- ${c.date} · ${c.channel}${c.note ? `: ${c.note}` : ""}`).join("\n")
            : "- (nenhum contato registrado)";

    return `[Sistema de gestão · etapa ${stageLabel}] Escreva a próxima mensagem de follow-up para este lead pelo WhatsApp.

${leadBlock(lead)}

Histórico de contatos (mais recente primeiro):
${history}

Mensagem curta, natural, sem pressão, com um próximo passo claro. Se já foram 3 tentativas sem resposta, escreva a mensagem de encerramento.`;
}

type PromptClient = {
    legalName: string | null;
    document: string | null;
    street: string | null;
    addressNumber: string | null;
    addressComplement: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    email: string | null;
};

type PromptProposal = { title: string; publicUrl: string };

// Etapa "Fechamento": contrato a partir do modelo e da proposta aprovada.
export function contractPrompt(lead: PromptLead, client: PromptClient | null, proposal: PromptProposal | null) {
    const address = client
        ? [client.street, client.addressNumber, client.addressComplement, client.neighborhood, client.city, client.state, client.zipCode]
              .filter(Boolean)
              .join(", ")
        : "";

    return `[Sistema de gestão · etapa Fechamento] Gere o contrato deste cliente a partir do modelo de contrato do serviço contratado (pasta contratos/ do projeto).

${leadBlock(lead)}

Dados do contratante:
- Nome completo / razão social: ${client?.legalName ?? "(faltando)"}
- CPF/CNPJ: ${client?.document ?? "(faltando)"}
- Endereço: ${address || "(faltando)"}
- E-mail: ${client?.email ?? "(faltando)"}

Proposta aprovada: ${proposal ? `${proposal.title} · ${proposal.publicUrl}` : "(nenhuma)"}

Use os valores, prazo e forma de pagamento da proposta aprovada. Gere em .docx e PDF e me diga o que faltar.`;
}

type PromptProposalFollowUp = {
    clientName: string;
    contactName: string | null;
    title: string;
    publicUrl: string;
    total: string;
    sentLabel: string;
    viewsLabel: string;
    attemptsWithoutReply: number;
};

// Follow-up de proposta enviada (ficha da proposta): leva o contexto que o Claude não tem
// (há quantos dias foi enviada, se o cliente abriu o link, o histórico de tentativas).
export function proposalFollowUpPrompt(proposal: PromptProposalFollowUp, contacts: PromptContact[]) {
    const history =
        contacts.length > 0
            ? contacts.map((c) => `- ${c.date} · ${c.channel}${c.note ? `: ${c.note}` : ""}`).join("\n")
            : "- (nenhum follow-up registrado ainda)";

    return `[Sistema de gestão · Proposta enviada] Escreva a próxima mensagem de follow-up desta proposta pelo WhatsApp.

- Cliente: ${proposal.clientName}${proposal.contactName ? ` (contato: ${proposal.contactName})` : ""}
- Proposta: ${proposal.title} · ${proposal.total}
- Link: ${proposal.publicUrl}
- Envio: ${proposal.sentLabel}
- Visualizações do link: ${proposal.viewsLabel}
- Tentativas sem resposta desde o último retorno do cliente: ${proposal.attemptsWithoutReply}

Histórico de follow-ups (mais recente primeiro):
${history}

Mensagem curta, natural, sem pressão, com um próximo passo claro. Leve em conta se ele já abriu o link ou não, e a validade de 7 dias da proposta. Se já foram 3 tentativas sem resposta, escreva a mensagem de encerramento.`;
}

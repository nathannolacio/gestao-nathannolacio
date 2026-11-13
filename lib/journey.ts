// Jornada comercial: o roteiro de cada etapa do lead (objetivo, checklist e o que fazer fora do sistema).
// O checklist NÃO é salvo no banco: cada item é calculado a partir dos dados que já existem
// (prévia preenchida, contatos registrados, diagnóstico respondido, proposta enviada...).
// Imports relativos com .ts: o arquivo pode ser lido por scripts fora do Next.

import { diagnosisQuestions, type LeadDiagnosis, type LeadPriority, type LeadStage } from "./leads.ts";

// Etapas da barra, na ordem. "prospect" acontece antes de o lead existir (lote no Claude → importar).
export const journeySteps = [
    { id: "prospect", label: "Prospectar" },
    { id: "new", label: "Abordar" },
    { id: "contacted", label: "Follow-up" },
    { id: "talking", label: "Conversa" },
    { id: "diagnosis", label: "Diagnóstico" },
    { id: "proposal", label: "Proposta" },
    { id: "won", label: "Fechamento" },
] as const satisfies readonly { id: "prospect" | Exclude<LeadStage, "lost">; label: string }[];

export type JourneyStepId = (typeof journeySteps)[number]["id"];

// Posição da etapa na barra (perdido fica fora da barra: a tela mostra o motivo).
export function stepIndex(stage: LeadStage) {
    return journeySteps.findIndex((step) => step.id === stage);
}

// O que fazer em cada etapa e o que faz o lead avançar.
export const stageGuide: Record<LeadStage, { goal: string; exit: string }> = {
    new: {
        goal: "Mandar a primeira mensagem. Lead A recebe prévia própria; B recebe a demo do nicho.",
        exit: "Registrou o primeiro contato → Contatado.",
    },
    contacted: {
        goal: "Esperar a resposta e fazer o follow-up na data marcada (até 3 tentativas).",
        exit: "Respondeu → Em conversa. Pediu para parar ou sumiu → Perdido.",
    },
    talking: {
        goal: "Entender o negócio e marcar o diagnóstico (15 a 20 min, ligação ou presencial).",
        exit: "Diagnóstico marcado ou feito → Diagnóstico.",
    },
    diagnosis: {
        goal: "Fazer o diagnóstico com o roteiro e montar a proposta a partir das respostas.",
        exit: "Proposta enviada → Proposta enviada (automático ao enviar).",
    },
    proposal: {
        goal: "Acompanhar a proposta até a resposta. A validade é de 7 dias: use isso no follow-up.",
        exit: "Aprovou na página → Ganho (automático). Recusou → Perdido.",
    },
    won: {
        goal: "Fechar: dados do contrato, contrato assinado, entrada paga e onboarding da entrega.",
        exit: "Contrato assinado e entrada paga → começa a entrega.",
    },
    lost: {
        goal: "Registrar o motivo e, se fizer sentido, voltar a falar em alguns meses.",
        exit: "",
    },
};

// Próxima ação em uma linha (cards do pipeline).
export const nextActionLabel: Record<LeadStage, string> = {
    new: "Mandar a 1ª mensagem",
    contacted: "Fazer follow-up",
    talking: "Marcar diagnóstico",
    diagnosis: "Montar e enviar proposta",
    proposal: "Acompanhar proposta",
    won: "Contrato e onboarding",
    lost: "",
};

// Fatos do lead usados no checklist (montados pela página a partir do banco).
export type JourneyFacts = {
    priority: LeadPriority | null;
    hasPhone: boolean;
    hasInstagram: boolean;
    hasPreview: boolean;
    contacts: number;
    hasFollowUp: boolean;
    diagnosis: LeadDiagnosis | null;
    proposalStatuses: ("draft" | "sent" | "approved")[];
    // null = o lead ainda não tem cliente.
    contractDataReady: boolean | null;
};

// done: true/false = calculado pelo sistema; null = acontece fora do sistema (só lembrete).
export type ChecklistItem = { label: string; done: boolean | null; hint?: string };

export function diagnosisProgress(diagnosis: LeadDiagnosis | null) {
    const answered = diagnosisQuestions.filter((q) => diagnosis?.[q.id]?.trim()).length;
    return { answered, total: diagnosisQuestions.length };
}

export function journeyChecklist(stage: LeadStage, facts: JourneyFacts): ChecklistItem[] {
    const { answered, total } = diagnosisProgress(facts.diagnosis);
    const sent = facts.proposalStatuses.some((s) => s === "sent" || s === "approved");
    const approved = facts.proposalStatuses.includes("approved");
    const followUp: ChecklistItem = { label: "Próximo follow-up agendado", done: facts.hasFollowUp };

    switch (stage) {
        case "new":
            return [
                { label: "Canal de contato (WhatsApp ou Instagram)", done: facts.hasPhone || facts.hasInstagram },
                ...(facts.priority === "A"
                    ? [{ label: "Prévia do site pronta", done: facts.hasPreview, hint: "Gere com o Claude e cole o link em Dados do lead." }]
                    : []),
                { label: "Primeira mensagem enviada e registrada", done: facts.contacts > 0 },
            ];
        case "contacted":
            return [{ label: "Primeiro contato registrado", done: facts.contacts > 0 }, followUp];
        case "talking":
            return [
                followUp,
                { label: "Diagnóstico marcado", done: null, hint: "Combine dia e hora pelo WhatsApp." },
                { label: "Diagnóstico começado", done: answered > 0 },
            ];
        case "diagnosis":
            return [
                { label: `Diagnóstico respondido (${answered} de ${total})`, done: answered === total },
                { label: "Prévia ou demo apresentada", done: facts.hasPreview },
                { label: "Proposta criada", done: facts.proposalStatuses.length > 0 },
                { label: "Proposta enviada", done: sent },
            ];
        case "proposal":
            return [{ label: "Proposta enviada", done: sent }, followUp];
        case "won":
            return [
                { label: "Proposta aprovada", done: approved },
                {
                    label: "Dados do contrato do cliente",
                    done: facts.contractDataReady ?? false,
                    hint: "Nome completo, CPF/CNPJ e endereço, na tela de Clientes.",
                },
                { label: "Contrato gerado e assinado", done: null, hint: "Gere com o Claude e envie para assinatura." },
                { label: "Entrada recebida (Pix)", done: null },
                { label: "Onboarding: materiais pedidos (logo, fotos, textos)", done: null },
            ];
        case "lost":
            return [];
    }
}

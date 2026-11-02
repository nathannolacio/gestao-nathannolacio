import * as z from "zod";
import {
    contactChannels,
    diagnosisQuestions,
    isOpenStage,
    leadSources,
    leadStages,
} from "../leads.ts";

// Converte o valor cru de um campo opcional: ausente ou "" (só espaços) viram null.
function blankToNull(value: unknown) {
    if (value === undefined) return null;
    return typeof value === "string" ? value.trim() || null : value;
}

// Texto opcional de formulário: tira espaços das pontas; ausente ou "" vira null (limpa a coluna).
function optionalText(label: string, max: number) {
    return z.preprocess(
        blankToNull,
        z.string().max(max, `${label} deve ter no máximo ${max} caracteres.`).nullable(),
    );
}

// Data "AAAA-MM-DD" (o <input type="date"> já manda assim) ou vazio = null.
const optionalDate = z.preprocess(
    blankToNull,
    z.iso.date("Data inválida.").nullable(),
);

// Campos do lead (cadastro e edição usam os mesmos).
const leadFields = {
    businessName: z
        .string("O nome do negócio é obrigatório.")
        .trim()
        .min(2, "O nome do negócio deve ter pelo menos 2 caracteres.")
        .max(100, "O nome do negócio deve ter no máximo 100 caracteres."),
    contactName: optionalText("O nome do contato", 100),
    segment: optionalText("O segmento", 60),
    city: optionalText("A cidade", 100),
    // Opcional, mas se vier precisa ser um WhatsApp completo (55 + DDD + número).
    phone: z.preprocess(
        (value) => {
            if (value === undefined) return null;
            if (typeof value !== "string") return value;
            const digits = value.replace(/\D/g, "");
            return digits === "" ? null : digits;
        },
        z.string().regex(/^\d{12,13}$/, "O WhatsApp deve ter 12 ou 13 dígitos (55 + DDD + número).").nullable(),
    ),
    // Aceita "@usuario", "usuario" ou o link do perfil; guarda só o usuário.
    instagram: z.preprocess(
        (value) => {
            if (value === undefined) return null;
            if (typeof value !== "string") return value;
            const user = value
                .trim()
                .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
                .replace(/^@/, "")
                .replace(/[/?].*$/, "");
            return user === "" ? null : user;
        },
        z
            .string()
            .regex(/^[A-Za-z0-9._]{1,60}$/, "Instagram inválido (use só o usuário, ex.: @docesdamaria).")
            .nullable(),
    ),
    source: z.enum(leadSources, "Selecione a origem."),
    referredBy: optionalText("Quem indicou", 100),
    stage: z.enum(leadStages, "Selecione o estágio."),
    lostReason: optionalText("O motivo", 200),
    nextFollowUpAt: optionalDate,
    notes: optionalText("As observações", 2000),
};

type LeadRules = {
    source: (typeof leadSources)[number];
    referredBy: string | null;
    stage: (typeof leadStages)[number];
    lostReason: string | null;
    nextFollowUpAt: string | null;
};

// Regras que cruzam campos (valem no cadastro e na edição).
function checkLeadRules(data: LeadRules, ctx: z.RefinementCtx) {
    if (data.stage === "lost" && !data.lostReason) {
        ctx.addIssue({ code: "custom", path: ["lostReason"], message: "Informe o motivo da perda." });
    }
}

// Normaliza o que depende do estágio: lead encerrado não tem follow-up; motivo só em perdido;
// "indicado por" só faz sentido com origem = indicação.
function normalizeLead<T extends LeadRules>(data: T): T {
    return {
        ...data,
        referredBy: data.source === "referral" ? data.referredBy : null,
        lostReason: data.stage === "lost" ? data.lostReason : null,
        nextFollowUpAt: isOpenStage(data.stage) ? data.nextFollowUpAt : null,
    };
}

export const leadSchema = z.object(leadFields).superRefine(checkLeadRules).transform(normalizeLead);
export type LeadInput = z.infer<typeof leadSchema>;

export const updateLeadSchema = z
    .object({ id: z.uuid("Lead inválido."), ...leadFields })
    .superRefine(checkLeadRules)
    .transform(normalizeLead);

// Registrar um contato. Pode, no mesmo passo, mudar o estágio e marcar o próximo follow-up.
export const leadContactSchema = z
    .object({
        leadId: z.uuid("Lead inválido."),
        channel: z.enum(contactChannels, "Selecione o canal."),
        note: optionalText("A anotação", 500),
        // Ausente = não mexe no estágio.
        stage: z.enum(leadStages, "Estágio inválido.").optional(),
        lostReason: optionalText("O motivo", 200),
        nextFollowUpAt: optionalDate,
    })
    .superRefine((data, ctx) => {
        if (data.stage === "lost" && !data.lostReason) {
            ctx.addIssue({ code: "custom", path: ["lostReason"], message: "Informe o motivo da perda." });
        }
        if (data.stage && !isOpenStage(data.stage) && data.nextFollowUpAt) {
            ctx.addIssue({
                code: "custom",
                path: ["nextFollowUpAt"],
                message: "Lead ganho ou perdido não tem próximo follow-up.",
            });
        }
    });

// Diagnóstico: só aceita os ids do roteiro; resposta vazia é descartada.
const diagnosisIds = diagnosisQuestions.map((q) => q.id) as [
    (typeof diagnosisQuestions)[number]["id"],
    ...(typeof diagnosisQuestions)[number]["id"][],
];

export const leadDiagnosisSchema = z.object({
    leadId: z.uuid("Lead inválido."),
    answers: z
        .partialRecord(z.enum(diagnosisIds), z.string().max(1000, "Cada resposta deve ter no máximo 1000 caracteres."))
        .transform((answers) =>
            Object.fromEntries(
                Object.entries(answers)
                    .map(([id, text]) => [id, (text ?? "").trim()] as const)
                    .filter(([, text]) => text !== ""),
            ),
        ),
});

export const leadIdSchema = z.object({ id: z.uuid("Lead inválido.") });

import { leadStageLabel, type LeadStage } from "@/lib/leads";

// Mesmo visual do StatusBadge das propostas: ponto colorido + rótulo.
const stageStyle: Record<LeadStage, { dot: string; text: string }> = {
    new: { dot: "bg-admin-muted", text: "text-admin-muted" },
    contacted: { dot: "bg-admin-muted", text: "text-admin-text" },
    talking: { dot: "bg-dourado/70", text: "text-admin-text" },
    diagnosis: { dot: "bg-dourado", text: "text-dourado" },
    proposal: { dot: "bg-dourado", text: "text-dourado" },
    won: { dot: "bg-admin-success", text: "text-admin-success" },
    lost: { dot: "bg-red-400/70", text: "text-admin-muted" },
};

export function StageBadge({ stage }: { stage: LeadStage }) {
    const { dot, text } = stageStyle[stage];

    return (
        <span className={`inline-flex items-center gap-2 text-sm ${text}`}>
            <span aria-hidden="true" className={`size-1.5 rounded-full ${dot}`} />
            {leadStageLabel[stage]}
        </span>
    );
}

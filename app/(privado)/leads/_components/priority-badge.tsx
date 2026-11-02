import { leadPriorityHint, type LeadPriority } from "@/lib/leads";

// Nota de prospecção: A em dourado (vale prévia), B neutra, C apagada.
const style: Record<LeadPriority, string> = {
    A: "border-dourado/60 text-dourado",
    B: "border-admin-line text-admin-text",
    C: "border-admin-line text-admin-muted",
};

export function PriorityBadge({ priority }: { priority: LeadPriority }) {
    return (
        <span
            title={leadPriorityHint[priority]}
            className={`inline-flex size-6 items-center justify-center rounded-md border text-xs font-semibold ${style[priority]}`}
        >
            <span className="sr-only">Nota </span>
            {priority}
        </span>
    );
}

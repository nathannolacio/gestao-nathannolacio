import type { proposals } from "@/db/schema";

type Status = typeof proposals.$inferSelect.status;

// O banco guarda em inglês; a tela mostra em português.
const statusConfig: Record<Status, { label: string; dot: string; text: string }> = {
  draft: { label: "Rascunho", dot: "bg-admin-muted", text: "text-admin-muted" },
  sent: { label: "Enviada", dot: "bg-dourado", text: "text-dourado" },
  approved: { label: "Aprovada", dot: "bg-admin-success", text: "text-admin-success" },
};

export function StatusBadge({ status }: { status: Status }) {
  const { label, dot, text } = statusConfig[status];

  return (
    <span className={`inline-flex items-center gap-2 text-sm ${text}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { proposalViews } from "@/db/schema";

// Recarregar a página logo em seguida não é uma nova visualização: dentro desta janela, conta uma só.
const SAME_VISIT_MINUTES = 30;

// Chamado pela página pública (fora de uma Server Action): o id vem do banco, pela busca do token,
// nunca do navegador.
export async function recordProposalView(proposalId: string) {
    const since = new Date(Date.now() - SAME_VISIT_MINUTES * 60_000);

    const [recent] = await db
        .select({ id: proposalViews.id })
        .from(proposalViews)
        .where(and(eq(proposalViews.proposalId, proposalId), gte(proposalViews.viewedAt, since)))
        .orderBy(desc(proposalViews.viewedAt))
        .limit(1);

    if (recent) return;

    await db.insert(proposalViews).values({ proposalId });
}

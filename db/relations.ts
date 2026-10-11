import { defineRelations } from "drizzle-orm";
import * as schema from "./schema.ts";

export const relations = defineRelations(schema, (r) => ({
    proposals: {
        client: r.one.clients({
            from: r.proposals.clientId,
            to: r.clients.id,
        }),
        items: r.many.proposalItems({
            from: r.proposals.id,
            to: r.proposalItems.proposalId,
        })
    },
    proposalItems: {
        proposal: r.one.proposals({
            from: r.proposalItems.proposalId,
            to: r.proposals.id,
        })
    }
}))
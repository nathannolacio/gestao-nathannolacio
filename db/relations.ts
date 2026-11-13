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
        }),
        lead: r.one.leads({
            from: r.proposals.leadId,
            to: r.leads.id,
        }),
        views: r.many.proposalViews({
            from: r.proposals.id,
            to: r.proposalViews.proposalId,
        }),
        contacts: r.many.proposalContacts({
            from: r.proposals.id,
            to: r.proposalContacts.proposalId,
        }),
    },
    proposalViews: {
        proposal: r.one.proposals({
            from: r.proposalViews.proposalId,
            to: r.proposals.id,
        }),
    },
    proposalContacts: {
        proposal: r.one.proposals({
            from: r.proposalContacts.proposalId,
            to: r.proposals.id,
        }),
    },
    proposalItems: {
        proposal: r.one.proposals({
            from: r.proposalItems.proposalId,
            to: r.proposals.id,
        })
    },
    leads: {
        contacts: r.many.leadContacts({
            from: r.leads.id,
            to: r.leadContacts.leadId,
        }),
        proposals: r.many.proposals({
            from: r.leads.id,
            to: r.proposals.leadId,
        }),
        batch: r.one.prospectingBatches({
            from: r.leads.batchId,
            to: r.prospectingBatches.id,
        }),
        client: r.one.clients({
            from: r.leads.clientId,
            to: r.clients.id,
        }),
    },
    prospectingBatches: {
        leads: r.many.leads({
            from: r.prospectingBatches.id,
            to: r.leads.batchId,
        }),
    },
    clients: {
        proposals: r.many.proposals({
            from: r.clients.id,
            to: r.proposals.clientId,
        }),
        leads: r.many.leads({
            from: r.clients.id,
            to: r.leads.clientId,
        }),
    },
    leadContacts: {
        lead: r.one.leads({
            from: r.leadContacts.leadId,
            to: r.leads.id,
        }),
    },
}))
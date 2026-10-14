"use server"

import { requireUser } from "@/lib/auth"
import { proposalSchema } from "@/lib/schemas/proposal";
import * as z from "zod";
import { randomBytes } from "node:crypto";
import { db } from "@/db";
import { clients, proposals } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { bonusCatalog } from "@/lib/proposal-bonuses";

export async function createProposal(input: unknown) {
    await requireUser();

    const result = proposalSchema.safeParse(input);

    if (!result.success) {
        const { fieldErrors } = z.flattenError(result.error);

        return { ok: false, fieldErrors };
    }

    const bonuses = bonusCatalog.filter((b) => result.data.bonuses.includes(b.id));

    const publicToken = randomBytes(18).toString("base64url");

    await db.transaction(async (tx) => {
        let clientId: string;

        if (result.data.client.clientMode === "existing") {
            clientId = result.data.client.clientId;

           const queryResult = await tx.select()
            .from(clients)
            .where(
                and(
                    eq(clients.id, clientId),
                    isNull(clients.deletedAt)
                ))

            if (queryResult.length === 0) {
                throw new Error("Cliente não encontrado.")
            }

        } else {
            const name = result.data.client.name;
            const email = result.data.client.email;
            const phone = result.data.client.phone;
            const type = result.data.client.type;

            const queryResult = await tx.insert(clients).values({ 
                name,
                email,
                phoneNumber: phone,
                type,
             }).returning({ insertedId: clients.id })

             clientId = queryResult[0].insertedId;
        }

        const proposalTemplate = await tx.query.proposalTemplate.findFirst();

        if (!proposalTemplate) {
            throw new Error("O template não foi encontrado.")
        } 
        
        const content = proposalTemplate.content;

        await tx.insert(proposals).values({
            publicToken,
            clientId,
            title: result.data.title,
            bonuses,
            deliveryDays: result.data.deliveryDays,
            discountType: result.data.discountType,
            discountValue: result.data.discountValue,
            hostingAnnual: result.data.hostingAnnual,
            fixedContent: content,
        });
    })

    return { ok: true };
}
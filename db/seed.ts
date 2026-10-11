import { db } from "./index.ts";
import { proposalTemplate } from "./schema.ts";
import { defaultFixedContent } from "../lib/proposal-content.ts";
import { eq } from "drizzle-orm";

async function main() {
    const result = await db.select({
        id: proposalTemplate.id
    })
    .from(proposalTemplate)
    .limit(1);

    if(result.length > 0) {
        const { id } = result[0];

        await db.update(proposalTemplate)
        .set({ content: defaultFixedContent })
        .where(eq(proposalTemplate.id, id));

        console.log("O template foi atualizado");
    } else {
        await db.insert(proposalTemplate)
        .values({ content: defaultFixedContent });

        console.log("O template foi inserido");
    }
}

main().catch((erro) => {
    console.error("Falhou:", erro);
    process.exit(1);
});
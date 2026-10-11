import { db } from "./index.ts";
import { clients, proposals } from "./schema.ts";
import { defaultFixedContent } from "../lib/proposal-content.ts";

async function main() {
    const result = await db.insert(clients)
    .values({ 
        type: "PF", 
        name: "Thais", 
        email: "thais@email", 
        phoneNumber: "11987654321" })
    .returning({ id: clients.id });

    const clientId = result[0].id;

    await db.insert(proposals)
    .values({
        publicToken: "teste-token-001",
        clientId,
        title: "Site institucional",
        deliveryDays: 15,
        fixedContent: defaultFixedContent
    });
}

main().catch((erro) => {
    console.error("Falhou: ", erro);
    process.exit(1);
});
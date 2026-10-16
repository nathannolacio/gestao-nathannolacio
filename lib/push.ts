import webpush from "web-push";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import {
    formatBRL,
    installmentAmount,
    pixTotal,
    projectTotal,
    toDiscount,
} from "@/lib/proposal-calc";

type PushPayload = { title: string; body: string; url: string };

// Envia o push para TODOS os aparelhos inscritos. Nunca lança: o aviso é um extra,
// e uma falha aqui não pode afetar quem chamou (ex.: a aprovação do cliente).
export async function sendPushToOwner(payload: PushPayload) {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT;
    if (!publicKey || !privateKey || !subject) {
        console.error("[push] variáveis VAPID não configuradas; aviso não enviado.");
        return;
    }

    try {
        const subscriptions = await db.select().from(pushSubscriptions);
        if (subscriptions.length === 0) return;

        const message = JSON.stringify(payload);
        const options = {
            vapidDetails: { subject, publicKey, privateKey },
            TTL: 60 * 60 * 24, // se o aparelho estiver desligado, o serviço de push guarda por 24h
            urgency: "high" as const, // entrega imediata, sem esperar o aparelho "acordar"
        };

        // Um aparelho com problema não impede os outros (allSettled).
        const results = await Promise.allSettled(
            subscriptions.map((sub) =>
                webpush.sendNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    message,
                    options,
                ),
            ),
        );

        // 404/410 = inscrição morta (app desinstalado, permissão revogada): limpa do banco.
        const dead: string[] = [];
        results.forEach((result, index) => {
            if (result.status === "rejected") {
                const status = (result.reason as { statusCode?: number }).statusCode;
                if (status === 404 || status === 410) {
                    dead.push(subscriptions[index].id);
                } else {
                    console.error("[push] falha ao enviar:", status ?? result.reason);
                }
            }
        });
        if (dead.length > 0) {
            await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, dead));
        }
    } catch (error) {
        console.error("[push] erro inesperado:", error);
    }
}

// Monta e envia o aviso "proposta aprovada". Valores calculados na hora, como no resto
// do sistema (nada de total salvo no banco).
export async function notifyProposalApproved(proposalId: string) {
    try {
        const proposal = await db.query.proposals.findFirst({
            where: { id: proposalId },
            with: { client: true, items: true },
        });
        if (!proposal || !proposal.client) return;

        const total = projectTotal(
            proposal.items.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: toDiscount(item.discountType, item.discountValue),
            })),
            toDiscount(proposal.discountType, proposal.discountValue),
        );

        let payment: string;
        if (proposal.paymentMethod === "pix") {
            payment = `Pix à vista, ${formatBRL(pixTotal(total))}`;
        } else if (proposal.paymentMethod === "split") {
            payment = `50% + 50%, total ${formatBRL(total)}`;
        } else if (proposal.paymentMethod === "card" && proposal.cardInstallments) {
            const n = proposal.cardInstallments;
            payment = `Cartão ${n}x de ${formatBRL(installmentAmount(total, n))}`;
        } else {
            payment = `Total ${formatBRL(total)}`;
        }

        await sendPushToOwner({
            title: "Proposta aprovada",
            body: `${proposal.client.name} aprovou "${proposal.title}". ${payment}.`,
            url: "/propostas",
        });
    } catch (error) {
        console.error("[push] não foi possível montar o aviso de aprovação:", error);
    }
}

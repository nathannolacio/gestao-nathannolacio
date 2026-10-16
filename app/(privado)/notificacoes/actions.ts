"use server";

import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { pushSubscriptionSchema } from "@/lib/schemas/push-subscription";

// Guarda a inscrição de push deste aparelho. Chamada pelo botão "Ativar notificações".
export async function savePushSubscription(input: unknown) {
    const user = await requireUser();

    const parsed = pushSubscriptionSchema.safeParse(input);
    if (!parsed.success) {
        return { ok: false, error: "Inscrição de notificação inválida." } as const;
    }
    const { endpoint, keys } = parsed.data;

    // Mesmo aparelho reativando: o endpoint é único, então atualiza em vez de duplicar.
    await db
        .insert(pushSubscriptions)
        .values({ userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth })
        .onConflictDoUpdate({
            target: pushSubscriptions.endpoint,
            set: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth },
        });

    return { ok: true } as const;
}

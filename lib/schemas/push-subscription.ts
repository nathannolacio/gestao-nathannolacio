import { z } from "zod";

// O servidor vai fazer um POST para o endpoint guardado. Para ele nunca apontar
// para um endereço qualquer (SSRF), só aceito os serviços de push dos navegadores.
const PUSH_HOSTS = [
    "web.push.apple.com", // Safari / iOS
    "push.apple.com",
    "fcm.googleapis.com", // Chrome / Android
    "updates.push.services.mozilla.com", // Firefox
    "notify.windows.com", // Edge / Windows
];

function isAllowedEndpoint(value: string) {
    try {
        const url = new URL(value);
        if (url.protocol !== "https:") return false;
        return PUSH_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
    } catch {
        return false;
    }
}

const base64Url = z.string().min(1).max(256).regex(/^[A-Za-z0-9_-]+={0,2}$/, "Chave inválida.");

// Formato do PushSubscription.toJSON() do navegador.
export const pushSubscriptionSchema = z.strictObject({
    endpoint: z.string().max(2048).refine(isAllowedEndpoint, "Endereço de push não aceito."),
    keys: z.strictObject({
        p256dh: base64Url,
        auth: base64Url,
    }),
});

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;

"use client";

import { useEffect } from "react";

// Registra o service worker ao abrir o sistema. Junto com o manifest, é o que
// deixa o navegador oferecer "Instalar app" e mostra a página offline sem internet.
// O mesmo /sw.js recebe as notificações push (ver push-toggle.tsx).
export function ServiceWorker() {
    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;
        navigator.serviceWorker.register("/sw.js").catch(() => {
            // Sem SW o sistema funciona normal, só não fica instalável/offline.
        });
    }, []);
    return null;
}

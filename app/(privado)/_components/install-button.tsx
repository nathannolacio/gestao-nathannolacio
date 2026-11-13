"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { DownloadIcon } from "./icons";

// Evento do Chrome/Edge/Android que permite abrir o "Instalar app" a partir de um botão.
type InstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Platform = "standalone" | "ios" | "other";

// Já aberto como app instalado? É iPhone/iPad (que não tem botão de instalar, só o menu Compartilhar)?
function readPlatform(): Platform {
    if (window.matchMedia("(display-mode: standalone)").matches) return "standalone";
    if ((navigator as Navigator & { standalone?: boolean }).standalone) return "standalone";
    const ua = navigator.userAgent;
    const iOS = /iphone|ipad|ipod/i.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
    return iOS ? "ios" : "other";
}

function subscribePlatform(onChange: () => void) {
    const query = window.matchMedia("(display-mode: standalone)");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
}

const base = "flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-sm text-admin-muted transition-colors";

// Item do menu "Instalar app". Some quando o sistema já está aberto como app.
export function InstallButton() {
    const platform = useSyncExternalStore(subscribePlatform, readPlatform, () => "standalone" as Platform);
    const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);

    useEffect(() => {
        function onPrompt(event: Event) {
            event.preventDefault(); // guarda o evento para abrir pelo nosso botão
            setPrompt(event as InstallPromptEvent);
        }
        function onInstalled() {
            setPrompt(null);
        }
        window.addEventListener("beforeinstallprompt", onPrompt);
        window.addEventListener("appinstalled", onInstalled);
        return () => {
            window.removeEventListener("beforeinstallprompt", onPrompt);
            window.removeEventListener("appinstalled", onInstalled);
        };
    }, []);

    if (platform === "standalone") return null;

    if (prompt) {
        return (
            <button
                type="button"
                onClick={async () => {
                    await prompt.prompt();
                    await prompt.userChoice;
                    setPrompt(null); // o evento só pode ser usado uma vez
                }}
                className={`${base} cursor-pointer hover:bg-admin-raised hover:text-admin-text`}
            >
                <DownloadIcon />
                Instalar app
            </button>
        );
    }

    if (platform === "ios") {
        return (
            <details className="group px-3 py-1.5 text-sm text-admin-muted">
                <summary className="flex cursor-pointer list-none items-center gap-3 whitespace-nowrap hover:text-admin-text [&::-webkit-details-marker]:hidden">
                    <DownloadIcon />
                    Instalar app
                </summary>
                <p className="mt-1 pl-8 text-xs leading-relaxed">
                    No Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”.
                </p>
            </details>
        );
    }

    // Navegador sem suporte ao botão (ou já instalado em outra janela): nada a mostrar.
    return null;
}

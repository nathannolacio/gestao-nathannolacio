"use client";

import { useState } from "react";
import { whatsappUrl } from "@/lib/leads";

// Mensagem pronta da 1ª abordagem: vem preenchida (firstMessage, no servidor) e pode ser ajustada antes
// de abrir o WhatsApp. O envio continua manual: o link só abre a conversa com o texto, quem envia é você.
export function FirstMessage({ phone, initialText }: { phone: string; initialText: string }) {
    const [text, setText] = useState(initialText);

    return (
        <div className="space-y-3">
            <label htmlFor="first-message" className="sr-only">
                Mensagem
            </label>
            <textarea
                id="first-message"
                rows={10}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full rounded-lg border border-admin-line bg-admin-raised/40 px-3 py-2 text-base text-admin-text sm:text-sm"
            />
            <div className="flex flex-wrap items-center gap-3">
                <a
                    href={whatsappUrl(phone, text)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-dourado px-4 py-2 text-sm font-medium text-grafite transition-opacity duration-150 hover:opacity-90"
                >
                    Abrir no WhatsApp
                </a>
                <p className="text-xs text-admin-muted">
                    Mande o print da prévia antes do texto. Depois, registre o contato abaixo.
                </p>
            </div>
        </div>
    );
}

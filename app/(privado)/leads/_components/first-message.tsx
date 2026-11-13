"use client";

import { useState } from "react";
import {
    firstMessage,
    messageOfferLabel,
    messageOffers,
    whatsappUrl,
    type MessageLead,
    type MessageOffer,
} from "@/lib/leads";

// Mensagem pronta da 1ª abordagem: vem preenchida (modelo de site ou de cardápio, sugerido pelo segmento)
// e pode ser ajustada antes de abrir o WhatsApp. Trocar a oferta refaz o texto (perde o que foi editado).
// O envio continua manual: o link só abre a conversa com o texto, quem envia é você.
export function FirstMessage({
    phone,
    lead,
    initialOffer,
}: {
    phone: string;
    lead: MessageLead;
    initialOffer: MessageOffer;
}) {
    const [offer, setOffer] = useState(initialOffer);
    const [text, setText] = useState(() => firstMessage(lead, initialOffer));

    function changeOffer(next: MessageOffer) {
        setOffer(next);
        setText(firstMessage(lead, next));
    }

    return (
        <div className="space-y-3">
            <div role="radiogroup" aria-label="Oferta" className="flex gap-1">
                {messageOffers.map((option) => (
                    <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={offer === option}
                        onClick={() => changeOffer(option)}
                        className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-colors duration-150 ${
                            offer === option
                                ? "border-dourado text-admin-text"
                                : "border-admin-line text-admin-muted hover:text-admin-text"
                        }`}
                    >
                        {messageOfferLabel[option]}
                    </button>
                ))}
            </div>
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

import type { Metadata, Viewport } from "next";

// Metadados que tornam o sistema "instalável" (PWA). Ficam SÓ no admin e no login:
// a página pública da proposta (/proposta/[token]) é vista pelo cliente e não deve
// oferecer "instalar Gestão". Por isso não estão no layout raiz.
export const installableMetadata: Metadata = {
    manifest: "/manifest.webmanifest",
    // O iOS usa o apple-touch-icon como ícone da tela inicial.
    icons: { apple: "/icons/icon-180.png" },
    appleWebApp: { capable: true, title: "Gestão", statusBarStyle: "black-translucent" },
};

export const installableViewport: Viewport = {
    themeColor: "#0c0c10",
    viewportFit: "cover",
};

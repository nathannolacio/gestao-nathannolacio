import type { MetadataRoute } from "next";

// Manifest do PWA. O iOS só libera notificações push para apps instalados na
// tela inicial, e só trata como "app" quando display é standalone.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gestão",
    short_name: "Gestão",
    description: "Sistema de gestão pessoal",
    start_url: "/propostas",
    scope: "/",
    display: "standalone",
    background_color: "#16161c",
    theme_color: "#16161c",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}

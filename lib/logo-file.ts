// Regras do arquivo de logo do cliente. Puro (sem rede), para ser reutilizado
// pela action de upload e, no futuro, testado.

export const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB

export type LogoType = { ext: "png" | "jpg" | "webp"; contentType: string };

// Identifica o formato pelos PRIMEIROS BYTES (assinatura), nunca pelo nome ou
// pelo `type` que o navegador manda: os dois são controlados por quem envia.
// SVG fica de fora de propósito: pode carregar <script>.
export function detectLogoType(bytes: Uint8Array): LogoType | null {
  const startsWith = (sig: number[], offset = 0) =>
    sig.every((byte, i) => bytes[offset + i] === byte);

  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { ext: "png", contentType: "image/png" };
  }
  if (startsWith([0xff, 0xd8, 0xff])) {
    return { ext: "jpg", contentType: "image/jpeg" };
  }
  // WebP: "RIFF" + 4 bytes de tamanho + "WEBP"
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) {
    return { ext: "webp", contentType: "image/webp" };
  }
  return null;
}

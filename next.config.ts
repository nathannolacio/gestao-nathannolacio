import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    // Padrão é 1 MB; a logo do cliente pode ter até 2 MB (+ overhead do multipart).
    serverActions: { bodySizeLimit: "3mb" },
  },
  cacheComponents: true,
  // O `next dev` loga nome e ARGUMENTOS de cada Server Function; no login isso
  // imprimiria a senha no terminal.
  logging: {
    serverFunctions: false,
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

import type { NextConfig } from "next";

/**
 * Configuración para exportación 100 % estática (sin servidor de aplicación).
 * Se quitaron `cacheComponents` y `partialPrefetching` de la plantilla por
 * requerir runtime de servidor, incompatible con `output: "export"`.
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactCompiler: true,
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

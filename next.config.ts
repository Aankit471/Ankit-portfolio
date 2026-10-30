import type { NextConfig } from "next";

// `NEXT_STATIC_EXPORT=1 next build` emits a fully static site in `out/`
// (used for the Cloudflare Sites deployment). `next dev` is unaffected.
const isStaticExport = process.env.NEXT_STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  /* config options here */
  ...(isStaticExport
    ? { output: "export" as const, images: { unoptimized: true } }
    : { cacheComponents: true, partialPrefetching: true }),
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

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploying

This portfolio is hosted on Freebuff Sites (Cloudflare Workers). The page is fully
prerendered, so deployment is a static export served by a tiny Worker:

```bash
# 1. static export -> out/
NEXT_STATIC_EXPORT=1 npx next build

# 2. optional: exercise the Worker in workerd before uploading
npx wrangler dev --config deploy/wrangler.jsonc

# 3. upload out/ + deploy/worker.js using sites.manifest.json
```

`deploy/worker.js` serves `env.ASSETS` and falls back to the single page for HTML
navigations. `next dev` is unaffected by the export config.

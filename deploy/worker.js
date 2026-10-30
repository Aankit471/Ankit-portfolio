/**
 * Cloudflare Workers entrypoint for the static Next.js export in `out/`.
 *
 * Everything is prerendered, so the Worker only has to serve assets and fall
 * back to the single page for HTML navigations (e.g. `/projects` → `/`).
 */
const worker = {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);

    if (response.status !== 404 || request.method !== "GET") return response;

    const accept = request.headers.get("accept") ?? "";
    if (!accept.includes("text/html")) return response;

    const indexUrl = new URL(request.url);
    indexUrl.pathname = "/";
    indexUrl.search = "";

    const index = await env.ASSETS.fetch(new Request(indexUrl.toString(), { method: "GET" }));
    if (!index.ok) return response;

    return new Response(index.body, {
      status: 200,
      headers: index.headers,
    });
  },
};

export default worker;

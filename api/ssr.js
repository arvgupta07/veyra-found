/**
 * Vercel SSR adapter for Veyra Found (TanStack Start)
 *
 * Vercel calls this function for every request that isn't a static file.
 * It wraps the TanStack Start server (a Web Fetch API handler) so it works
 * as a standard Vercel Node.js serverless function.
 */

import path from "path";

export const config = {
  maxDuration: 30,
};

let cachedServer = null;

async function getServer() {
  if (cachedServer) return cachedServer;
  // process.cwd() in the Vercel Lambda = /var/task (the function bundle root)
  // includeFiles puts dist/server/** there, so this path resolves correctly.
  const serverPath = path.resolve(process.cwd(), "dist/server/server.js");
  const mod = await import(serverPath);
  cachedServer = mod.default;
  return cachedServer;
}

export default async function handler(req, res) {
  try {
    const server = await getServer();

    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host || "localhost";
    const url = new URL(req.url, `${protocol}://${host}`);

    // Build Web-standard Headers from Node.js IncomingMessage headers
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const v of value) headers.append(key, v);
      } else {
        headers.set(key, value);
      }
    }

    // Read request body for non-GET/HEAD requests
    let body = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      if (chunks.length > 0) body = Buffer.concat(chunks);
    }

    // Create a Web standard Request and call the TanStack Start server
    const request = new Request(url.toString(), {
      method: req.method,
      headers,
      body,
    });

    const response = await server.fetch(request, {}, {});

    // Write response status + headers back to Vercel's Node.js response
    res.status(response.status);
    for (const [key, value] of response.headers.entries()) {
      // Skip content-encoding — Vercel handles compression automatically
      if (key.toLowerCase() === "content-encoding") continue;
      res.setHeader(key, value);
    }

    const buffer = await response.arrayBuffer();
    res.end(Buffer.from(buffer));
  } catch (err) {
    console.error("[Veyra SSR] Handler error:", err);
    res.status(500).send("Internal Server Error");
  }
}

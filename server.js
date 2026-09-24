import path from "node:path";

const port = Number.parseInt(process.env.PORT || "3000", 10);
const publicDir = process.env.PUBLIC_DIR
  ? path.resolve(process.cwd(), process.env.PUBLIC_DIR)
  : null;
const baseUrl = (process.env.BASE_URL
  || (process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${port}`)).replace(/\/$/, "");

const links = new Map();
const base62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function codeForLink() {
  let code;
  do {
    code = Array.from({ length: 6 }, () => base62[Math.floor(Math.random() * base62.length)]).join("");
  } while (links.has(code));
  return code;
}

async function servePublicFile(pathname) {
  if (!publicDir) return null;

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.slice(1);
  const filePath = path.resolve(publicDir, relativePath);
  if (filePath !== publicDir && !filePath.startsWith(`${publicDir}${path.sep}`)) return null;

  const file = Bun.file(filePath);
  return await file.exists() ? file : null;
}

const server = Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });

    if (request.method === "POST" && url.pathname === "/api/links") {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }

      let target;
      try {
        target = new URL(body?.url);
      } catch {
        return json({ error: "URL must use http or https" }, 400);
      }
      if (target.protocol !== "http:" && target.protocol !== "https:") {
        return json({ error: "URL must use http or https" }, 400);
      }

      const code = codeForLink();
      const link = {
        code,
        url: target.href,
        shortUrl: `${baseUrl}/${code}`,
        hits: 0,
        createdAt: new Date().toISOString(),
      };
      links.set(code, link);
      return json(link, 201);
    }

    if (request.method === "GET" && url.pathname === "/api/links") {
      return json([...links.values()]);
    }

    if (request.method === "GET") {
      const publicFile = await servePublicFile(url.pathname);
      if (publicFile) return new Response(publicFile);

      const code = url.pathname.slice(1);
      const link = links.get(code);
      if (link && code && !code.includes("/")) {
        link.hits += 1;
        return new Response(null, {
          status: 302,
          headers: {
            Location: link.url,
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    }

    return json({ error: "Not found" }, 404);
  },
});

console.log(`Snip listening on ${server.url}`);
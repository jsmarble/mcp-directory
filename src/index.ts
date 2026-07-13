import { directoryHtml, directoryJson, SERVERS } from "./directory";

/**
 * Serves the shared MCP hostname's root: a directory of every hosted server.
 * Any path not claimed by a server's own route lands here too and gets a 404
 * that still points at the directory.
 */

function wantsHtml(request: Request): boolean {
  return request.headers.get("Accept")?.includes("text/html") ?? false;
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      if (wantsHtml(request)) {
        return new Response(directoryHtml(url.origin), {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
      return Response.json(directoryJson(url.origin));
    }

    if (url.pathname === "/health") {
      return Response.json({
        name: "mcp-directory",
        status: "ok",
        servers: SERVERS.map((server) => server.path),
      });
    }

    // Unclaimed path: point the caller back at the directory.
    if (wantsHtml(request)) {
      return new Response(directoryHtml(url.origin), {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    return Response.json(
      {
        error: `No MCP server is hosted at ${url.pathname}`,
        ...directoryJson(url.origin),
      },
      { status: 404 },
    );
  },
} satisfies ExportedHandler<Env>;

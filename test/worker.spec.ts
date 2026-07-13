import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { SERVERS } from "../src/directory";

describe("directory", () => {
  it("lists every server as JSON at the root", async () => {
    const response = await SELF.fetch("https://example.com/");
    expect(response.status).toBe(200);
    const body = await response.json<{
      servers: { name: string; endpoint: string; health: string; repo: string }[];
    }>();
    expect(body.servers.length).toBe(SERVERS.length);
    const endpoints = body.servers.map((server) => server.endpoint);
    expect(endpoints).toContain("https://example.com/seats-aero");
    expect(endpoints).toContain("https://example.com/tripit");
    for (const server of body.servers) {
      expect(server.health).toBe(`${server.endpoint}/health`);
      expect(server.repo).toContain("github.com/jsmarble/");
    }
  });

  it("serves HTML to browsers at the root", async () => {
    const response = await SELF.fetch("https://example.com/", {
      headers: { Accept: "text/html,application/xhtml+xml" },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/html");
    const html = await response.text();
    expect(html).toContain("MCP servers");
    for (const server of SERVERS) {
      expect(html).toContain(server.path);
    }
  });

  it("serves a health check", async () => {
    const response = await SELF.fetch("https://example.com/health");
    expect(response.status).toBe(200);
    const body = await response.json<{ status: string; servers: string[] }>();
    expect(body.status).toBe("ok");
    expect(body.servers).toContain("/tripit");
  });

  it("returns a helpful 404 for unclaimed paths (JSON)", async () => {
    const response = await SELF.fetch("https://example.com/no-such-server");
    expect(response.status).toBe(404);
    const body = await response.json<{ error: string; servers: unknown[] }>();
    expect(body.error).toContain("/no-such-server");
    expect(body.servers.length).toBe(SERVERS.length);
  });

  it("returns the HTML directory with a 404 status for unclaimed paths (browser)", async () => {
    const response = await SELF.fetch("https://example.com/no-such-server", {
      headers: { Accept: "text/html" },
    });
    expect(response.status).toBe(404);
    expect(await response.text()).toContain("MCP servers");
  });

  it("escapes HTML in directory entries", async () => {
    const response = await SELF.fetch("https://example.com/", {
      headers: { Accept: "text/html" },
    });
    const html = await response.text();
    expect(html).not.toContain("<script");
  });
});

# mcp-directory

[![CI / Deploy](https://github.com/jsmarble/mcp-directory/actions/workflows/ci.yml/badge.svg)](https://github.com/jsmarble/mcp-directory/actions/workflows/ci.yml)

The directory page for the MCP servers hosted on **[mcp.joshuamarble.io](https://mcp.joshuamarble.io/)** — a tiny static Cloudflare Worker with no dependencies.

The shared hostname hosts one [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server per path (e.g. `/seats-aero`, `/tripit`), each running as its own Worker with its own `mcp.joshuamarble.io/<name>*` route. This Worker claims the catch-all `mcp.joshuamarble.io/*` route; because specific routes take precedence over the wildcard, it only ever sees the hostname root and paths no server has claimed:

| Path | Response |
|------|----------|
| `/` | The server directory — HTML for browsers (`Accept: text/html`), JSON otherwise |
| `/health` | Liveness JSON with the list of hosted server paths |
| anything else | `404` that still renders the directory, so lost visitors find the list |

The hostname's Custom Domain (the DNS + certificate anchor) stays attached to the [`seats-aero-mcp`](https://github.com/jsmarble/seats-aero-mcp) Worker; this Worker only needs the route.

## Adding a server to the directory

Servers register themselves in [src/directory.ts](src/directory.ts): add an entry (name, path, description, auth headers, repo), update the assertions in [test/worker.spec.ts](test/worker.spec.ts) if needed (most iterate over `SERVERS`), and push — CI deploys on merge to `main`. The full process for standing up a new hosted MCP server is documented in the [migration runbook](https://github.com/jsmarble/seats-aero-mcp/blob/main/docs/MIGRATION_RUNBOOK.md).

## Development

```bash
npm install
npm run dev      # wrangler dev → http://localhost:8787/
npm run lint     # lint + format check (Biome)
npm run check    # typecheck src and tests
npm test         # vitest suite inside the workerd runtime
npm run deploy   # manual deploy (CI normally does this)
```

## CI/CD

Every push and pull request runs Biome, a strict typecheck, the test suite in real `workerd`, and a `wrangler deploy --dry-run`. Pushes to `main` auto-deploy via [`cloudflare/wrangler-action`](https://github.com/cloudflare/wrangler-action) and smoke-test the live hostname — including asserting that the hosted servers' specific routes still beat this Worker's wildcard.

Repository secrets required for auto-deploy: `CLOUDFLARE_API_TOKEN` (Edit Cloudflare Workers template) and `CLOUDFLARE_ACCOUNT_ID`. While the token is unset the deploy job skips and quality gates still run.

## License

MIT

# Wandstark web app (Cloudflare Worker)

Serves the standalone build behind a 4-digit access code. Full instructions: [../docs/DEPLOY.md](../docs/DEPLOY.md).

- Build (from the repo root): `python3 build.py --standalone web/public/wandstark`
- Deploy: `cd web && npx wrangler@4 deploy` with `CLOUDFLARE_API_TOKEN` set in the environment
- Secrets: `PASSCODE` (4 digits) and `SESSION_SECRET`, set with `npx wrangler@4 secret put <NAME>`
- Gate tests: `node test-guard.mjs`

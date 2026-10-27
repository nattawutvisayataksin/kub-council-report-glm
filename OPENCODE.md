# Continuing this project with OpenCode

## Before changing code

1. Read `HANDOFF.md` for the verified on-chain model, RPC constraints, and current UI state.
2. Run `git status --short` before editing. Preserve uncommitted changes unless the user explicitly requests cleanup.
3. Keep all election values read-only and on-chain derived. Do not add mock data or wallet-write features.

## Commands

```powershell
npm install
npm run dev -- --host 127.0.0.1
npm run build
npm run verify
```

- The Vite watcher uses polling in `vite.config.ts` to avoid Windows `EBUSY` asset locks.
- `npm run verify` calls the public RPC and API. It can take time and must not be changed to concurrent balance reads.

## Pixel-theme work

- Read `.github/instructions/pixel-design.instructions.md` before editing Pixel assets or UI.
- PixelLab MCP configuration is in `.vscode/mcp.json`; the token is read from `PIXELLAB_TOKEN` and must never enter source control.
- Generator scripts are under `scripts/gen-pixel-*.ps1`. Keep prompts reproducible and artwork original.
- Current production hero asset is `src/assets/pixel/kub-pixel-party-banner.png`; it should show exactly five adult male adventurers.

## Publish

```powershell
git add -A
git commit -m "..."
git push origin main
```

Pushing `main` triggers `.github/workflows/deploy.yml` to publish GitHub Pages. The public URL is:

`https://nattawutvisayataksin.github.io/kub-council-report-glm/`

After pushing, check the Actions run and the deployed page before reporting completion.
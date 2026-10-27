---
description: "Use when designing or replacing Pixel-theme artwork, icons, logos, or banners in this project."
applyTo: "src/assets/pixel/**,src/components/PixelBanner.tsx,src/components/ThemeToggle.tsx,src/components/Footer.tsx,src/pixel-theme.css"
---

# Pixel design workflow

- Use the workspace `pixellab` MCP server for new Pixel-theme visual assets whenever it is available.
- Keep generated artwork original: do not request or reproduce named game franchises, copyrighted characters, or third-party logos.
- Store generated assets in `src/assets/pixel/` and use descriptive filenames.
- Keep KUB visuals compatible with the project's green, deep forest, white, and limited accent palette.
- For reproducible artwork, keep the prompt in a PowerShell generator script under `scripts/`; credentials must come from `PIXELLAB_TOKEN` and never be committed.
- Preserve on-chain data fetching and tally logic; visual work must not modify `src/lib/`, `src/hooks/useElection.ts`, or RPC concurrency behavior.

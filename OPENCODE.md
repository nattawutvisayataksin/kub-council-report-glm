# Continuing this project with OpenCode — Version 2.0 baseline

> สถานะ: Version 2.0 เสร็จสมบูรณ์และพักโปรเจคไว้ก่อน
> Pixel Version เป็นธีมเริ่มต้นสำหรับผู้เข้าชมใหม่

## Before changing code

1. Read `HANDOFF.md` for the verified on-chain model, RPC constraints, and current UI state.
2. Run `git status --short` before editing. Preserve uncommitted changes unless the user explicitly requests cleanup.
3. Keep all election values read-only and on-chain derived. Do not add mock data or wallet-write features.

## Version 2.0 handoff

- เปิด URL ใหม่ครั้งแรกจะเริ่มด้วย Pixel Version เพราะ `src/hooks/useTheme.ts` ใช้ `pixel` เป็น default
- ถ้า browser เคยเปิดโปรเจคนี้มาก่อน อาจมีค่า `kub-council-theme` ใน localStorage ให้ล้างค่านี้เพื่อดู default ใหม่
- Pixel hero อยู่ใน `src/components/PixelBanner.tsx` และ `src/pixel-theme.css`: ภาพเลื่อนวนซ้ายไปขวาแบบช้า, มีแสงด้านหลังเคลื่อนเบา ๆ และมี reduced-motion fallback
- ชื่อหัวข้อ Pixel คือ `KUB COMMUNITY COUNCIL`; ไม่มีคำว่า `ROUND 02`
- progress bar ของ countdown และ leader vote bar มี animation เฉพาะ presentation
- ห้ามแก้ animation ให้กระทบค่าคะแนน/เปอร์เซ็นต์จริง; inline `width` ของ bar ยังมาจากข้อมูล on-chain
- เอกสารสถานะและข้อควรระวังทั้งหมดอยู่ใน `HANDOFF.md`
- หลัง release นี้ให้พักงานไว้ก่อน; การพัฒนาต่อควรเริ่มจากการอ่าน `HANDOFF.md` และตรวจ `git status --short`

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

## KUB staking and unlock research

- The workspace also configures the public `kub-docs` MCP server at `https://docs.kubchain.com/~gitbook/mcp`.
- For file-based or offline research, start with `https://docs.kubchain.com/llms.txt`; it is a current page index. Use `llms-full.txt` only when a full static snapshot is required because it can become stale.
- Run `scripts/refresh-kub-docs-index.ps1` to save the current `llms.txt` under `.cache/kub-docs/` (gitignored).
- Run `scripts/refresh-kub-docs-index.ps1 -Full` to download `.cache/kub-docs/llms-full.txt` when one offline static snapshot is required. Refresh it before time-sensitive research.
- Before implementing GKT/KUB staking, NFT staking, or unlock analytics, use KUB Docs to locate the official contract addresses, ABI/source links, event names, and unlock rules.
- Treat Docs results as discovery only: verify each address and function against verified Kubscan source before displaying values.
- Do not infer a staking value from gKUB vote-burn events. Join voter wallets to staking state only after the relevant staking contract and ABI are verified.
- Maintain RPC safety: chunk logs; read per-wallet state sequentially with the existing delay/backoff strategy.
- KUB staking research code exists but its UI is intentionally parked/hidden. Do not re-enable it without a new user request and a review of validator/delegator scope, cache design, and RPC cost.

## Publish

```powershell
git add -A
git commit -m "..."
git push origin main
```

Pushing `main` triggers `.github/workflows/deploy.yml` to publish GitHub Pages. The public URL is:

`https://nattawutvisayataksin.github.io/kub-council-report-glm/`

After pushing, check the Actions run and the deployed page before reporting completion.
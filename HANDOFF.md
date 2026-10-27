# 📋 HANDOFF — KUB Council Report GLM (สามารถอ่านไฟล์นี้เดียวแล้วทำต่อได้)

> อัปเดตล่าสุด: 2026-10-27 · สถานะ: v1.1 + Pixel theme อยู่ใน working tree (ต้อง commit/push เพื่อ deploy)
> URL: https://nattawutvisayataksin.github.io/kub-council-report-glm/

---

## 1) โปรเจคนี้คืออะไร (ภาพรวมใน 30 วิ)

React 19 + TypeScript + Vite 7 + **viem 2** (ไม่มี chart lib, ไม่มี UI lib)
Dashboard เกาะติดผลโหวตจริงของ **KUB Community Council Election Round 2** บน
KUB Chain Mainnet (Chain ID 96) — **read-only 100% ไม่มีกระเป๋า ไม่มี API key**

หลักคิดสำคัญที่ "ห้ามพัง": ตัวเลขทุกตัวมาจาก **ProposalVoted logs ของเชนจริง → tally ด้วย BigInt แบบ exact wei**
แล้ว cross-check กับ API อย่างเป็นทางการ (`kubcouncil.vercel.app/api/votes`) — **ไม่มี mock data หลอกผู้ใช้เด็ดขาด**

## 2) ค่าที่ verify แล้ว (อยู่ใน `src/config/election.ts` พร้อม comment ยืนยัน)

| อย่าง | ค่า |
|---|---|
| Contract | `GKubProposalV2` @ `0x5aF70a51ddbb02e717540Dcda351706a1589F5B1` |
| gKUB token | `0x5848718437583e7a086c97836344aa43bfa55dab` — ชื่อจริงบนเชน = **"G KUB Token" (GKT), decimals 18, totalSupply ≈ 1,873,278.73** |
| Proposal | id **15–19** (5 หมวด), ช่วงโหวต 21 ต.ค. → 10 พ.ย. 2026 12:00 น. (ไทย) ts=1792558800→1794286800 |
| Event | `ProposalVoted` topic0 = `0xf3801d77e9bff0fe5c3de5dfbdbe6cf3d04bb3e22005abfe7bf389dc78476fd1` |
| Scan start | block `36255000`, chunk 4000 บล็อกต่อ call |
| ตัวเลข ณ 26 ต.ค. 2026 | **48 tx / 22 กระเป๋า / 1,201.1207 gKUB ถูกเผา** — ตรง API ทุกตัว (`npm run verify` ✓) |

## 3) Flow ข้อมูล

```
RPC rpc.kubchain.io (CORS เปิด) → eth_getLogs (chunk 4000) + readContract (getProposalInfoById, voteToken, balanceOf...)
  → merge/dedupe/tally exact wei → ElectionModel (src/lib/election.ts)
  → cross-check /api/votes (ชื่อผู้สมัคร + เทียบเลข) → src/lib/api.ts
    ⚠ API นี้ไม่แนบ CORS → จึงมีชื่อผู้สมัครฝังไว้ใน config (VERIFIED_CANDIDATE_NAMES) ใช้เป็นตัว label
  → React UI (Header/Countdown/SummaryStrip/StatsPanel/ProposalCard×5/TxFeed/WalletTable)
โหมด: live → api-fallback (banner เหลือง) → unavailable (banner แดง + ปุ่ม retry)
Poll ทุก ~15 วิ (ครั้งแรก scan เต็ม, รอบถัดไป incremental จาก block ล่าสุดที่ scan)
```

- โหวต = **เผา gKUB** (`voteToken.burn`) → tally additive จริง, ย้อนได้
- `VoteTokenWithdrawn` (คืน token) **ไม่ลด**คะแนนบนเชน (source ยืนยัน มีแต่ `+=`)
- balanceOf ทุกกระเป๋า = ยอด "ณ ปัจจุบัน" หลังเผา/เคลื่อนย้าย (โหวต burn ทันที จึงไม่รวมในยอด)

## 4) แผนที่ไฟล์ (หน้าที่เดียวต่อไฟล์)

| ไฟล์ | หน้าที่ |
|---|---|
| `src/config/chain.ts` | viem chain (id 96) + env (VITE_RPC_URL, VITE_API_FALLBACK_URL) + explorer URL helper |
| `src/config/election.ts` | ทุกค่า verified + ABI ย่อ + ชื่อผู้สมัครฝังไว้ |
| `src/lib/client.ts` | viem client + `pickStruct` (กัน tuple vs object) |
| `src/lib/election.ts` | **หัวใจ**: fetchElectionModel → getLogs chunked + view calls + cross-check + ประกอบโมเดล |
| `src/lib/api.ts` | fetch `/api/votes` (timeout 8s) |
| `src/lib/token.ts` | KAP20 ABI + tokenInfo + `fetchBalanceOne` (retry/backoff) — **⚠ ดูข้อ 6 rate limit** |
| `src/lib/analytics.ts` | buildWalletStats / buildBurnTimeline / buildProposalTotals |
| `src/lib/format.ts` | wei↔gKUB exact (18 dec) + เวลา Asia/Bangkok (BKK) + compareWeiTol |
| `src/lib/csv.ts` + `export.ts` | CSV 3 แบบ: ผลสรุป / ทุกธุรกรรม / ต่อผู้โหวต (มี BOM Excel) |
| `src/hooks/useElection.ts` | poll 15 วิ + incremental scan + cache blockTs |
| `src/hooks/useWalletAnalytics.ts` | balanceOf ทุกกระเป๋าแบบ **sequential เว้น ~420ms** + progress + manual refresh + auto 5 นาที |
| `src/hooks/useCountdown.ts` | นาฬิกาวินาที (UI only) |
| `src/components/*` | Header, CountdownCard, SummaryStrip (stat+3 export), **StatsPanel (donut+timeline SVG เอง)**, ProposalCard, **TxFeed (ปุ่มแสดงทั้งหมด + เรียงคอลัมน์)**, **WalletTable (analytics+ยอดกระเป๋า+expand+เรียง)**, SortTh (หัวตารางเรียงได้ ใช้ร่วม), Banners, Footer |
| `scripts/verify.ts` | `npm run verify` = พิสูจน์ end-to-end (exit 1 ถ้าเลขไม่ตรง API) |
| `src/pixel-theme.css` | Pixel Arts override: surfaces/typography/donut legend/footer branding |
| `src/assets/pixel/` | PixelLab-generated hero (`kub-pixel-party-banner.png`), KUB wordmark และภาพประกอบ Pixel |
| `scripts/gen-pixel-brand-assets.ps1` | สร้าง hero/brand artwork ผ่าน PixelLab; token จาก `PIXELLAB_TOKEN` เท่านั้น |
| `.vscode/mcp.json` | workspace MCP configuration สำหรับ PixelLab (ใช้ `${env:PIXELLAB_TOKEN}`) |
| `.github/instructions/pixel-design.instructions.md` | กติกางาน Pixel: ใช้ PixelLab, asset/originality, ห้ามแก้ on-chain logic |

### KUB Docs MCP (เพิ่ม 27 ต.ค. 2026)

- `.vscode/mcp.json` มี server `kub-docs` ชี้ไปที่ `https://docs.kubchain.com/~gitbook/mcp` (public HTTP MCP, ไม่ต้องมี token)
- สำหรับ AI ที่อ่านไฟล์: ใช้ `https://docs.kubchain.com/llms.txt` เป็น index ก่อน แล้ว fetch เฉพาะหน้าที่เกี่ยวข้อง; `llms-full.txt` เป็น snapshot สำหรับ offline เท่านั้นและอาจไม่ล่าสุด
- `scripts/refresh-kub-docs-index.ps1` ดาวน์โหลด index ล่าสุดไว้ `.cache/kub-docs/llms.txt` (gitignored); ใส่ `-Full` เพื่อดาวน์โหลด snapshot `.cache/kub-docs/llms-full.txt` เมื่อทำงาน offline และ refresh ก่อนใช้กับข้อมูลที่เปลี่ยนบ่อย
- ใช้ค้นเอกสารทางการเพื่อหา staking/NFT/unlock contract ก่อนพัฒนาฟีเจอร์ analytics ใหม่
- Docs เป็นจุดเริ่มค้นหาเท่านั้น: address, ABI, event และ unlock rules ต้องตรวจกับ verified source บน Kubscan อีกชั้น
- ห้ามเดา stake/unlock จาก `ProposalVoted` หรือ gKUB burn; ต้อง join ตาม wallet หลังรู้ staking contract ที่ถูกต้อง
| `.github/workflows/deploy.yml` | push main → build → GitHub Pages |

## 5) รอบนี้ (v1.1) เปลี่ยนอะไรจาก v1.0

- Analytics ผู้โหวต: ตารางต่อกระเป๋า (คะแนนเผา / tx / หมวด / ประวัติ expand) + **ยอด gKUB ในกระเป๋า ณ ปัจจุบัน** (balanceOf อ่านสด)
- Token stats: name/symbol/totalSupply อ่านจากเชน + % ที่ถูกเผาต่อยอดก่อนโหวต
- กราฟ: Donut การกระจายตามหมวด + Timeline เผาสะสมตามเวลา (SVG เขียนเอง ไม่เพิ่ม lib)
- CSV ไฟล์ 3 (ต่อผู้โหวต) + ปุ่ม "แสดงธุรกรรมทั้งหมด"
- เรียงคอลัมน์ asc/desc คลิกหัวตารางได้แล้ว ทั้ง TxFeed และ WalletTable (`SortTh` ใช้ร่วมกัน)

## 6) ⚠ ข้อค้นพบสำคัญ (ช่วยให้ไม่ต้องทดสอบซ้ำ)

1. **rpc.kubchain.io มี rate limit** — error `"Request exceeds defined limit."`
   - burst/concurrency ได้แย่ (ยิง 6 พร้อมกัน → ได้แค่ 6/22 ใบ)
   - **sequential เว้น ~400ms + retry/backoff = 22/22 ครบใน ~11 วิ** ← ใช้ท่านี้ตลอด
   - fetchElectionModel เอง (getLogs 22 chunk ตามลำดับ + 5 view calls Promise.all) ยังผ่านได้เสมอ
2. การเรียกครั้งแรกช้า ~20–30 วิเป็นปกติ (getLogs 22 chunk) ปล่อย incremental หลังจากนั้นเร็วมาก
3. viem คืน struct ได้ทั้ง array/object → ใช้ `pickStruct` เสมอ
4. tx getLogs params = `[filter]` อันเดียว (รูปที่ RPC นี้รับจริง)
5. UI ห้ามแสดงยอดที่ "อ่านไม่สำเร็จ" เป็น 0 — แสดง "—" + คำอธิบาย + ปุ่ม refetch เสมอ

## 7) วิธีรัน/ตรวจ

```bash
npm install            # ครั้งเดียว
npm run dev            # dev server ลองเล่น
npm run build          # tsc --noEmit + vite build
npm run verify         # พิสูจน์เลขเทียบ API (จริงกับเชน — ใช้เวลา ~40–60 วิ)
npm run preview        # ทดลอง dist
```

Windows note: `vite.config.ts` เปิด polling watcher เพราะ native watcher อาจล้มด้วย `EBUSY` เมื่อไฟล์ภาพใน `src/assets/pixel/` ถูกล็อกชั่วคราว

Deploy: `git push origin main` → GH Actions build+pages auto (~2 นาที)
ตรวจว่าเว็บ live update จริง: ดูชื่อไฟล์ asset ใน index.html เทียบกับ build ล่าสุด

## 8) ไอเดียค้างรอทำต่อ (รอผู้ใช้เลือก)

- [ ] ตัวกรอง/ดู Analytics ต่อ "ข้อ" (ตอนนี้รวม 5 ข้อ)
- [ ] Leaderboard ผู้ถือ gKUB ใหญ่ที่สุด (ต้องสแกน Transfer logs ของ token = หนัก, อาจทำเฉพาะช่วงเลือกตั้งเป็นต้นไป)
- [ ] i18n EN/TH + ธีมสี
- [ ] Share/OG image ผลโหวต
- [ ] เสียง/แจ้งเตือน เมื่อมีโหวตใหม่
- [ ] Refund table เรียงได้ด้วย (ปุ่มแสดงทั้งหมด refunds)

## 9) Pixel theme (อัปเดต 27 ต.ค. 2026)

- เปิดธีมด้วย class `pixel-theme` บน `<html>` ผ่าน `useTheme`; ไม่แตะ data/tally logic
- Hero ปัจจุบันต้องเป็น artwork PixelLab ที่มีผู้ชาย adult **5 คนเท่านั้น**; หาก output ไม่ตรง ให้สร้างใหม่ด้วย prompt ที่ระบุจำนวนชัดเจน
- KUB ใช้ wordmark Pixel ที่ออกแบบใน `src/assets/pixel/kub-wordmark.svg` สำหรับ header และปุ่มธีม
- Footer ใช้ monogram `V` และชื่อ `VeeNagi` แบบ Pixel typography; ไม่ใช้โลโก้งู
- ค่า `PIXELLAB_TOKEN` ห้ามเก็บใน markdown, source, หรือ git; ให้ตั้ง environment variable หรือ `scripts/pixellab-token.txt` (ถูก ignore)

## 10) KUB staking analytics (PARKED / ซ่อนไว้ก่อน)

- Verified from KUB Docs + Kubscan source:
  - StakeManager: `0x443502b3F7C0934576F49CDa084f78640f56A80F`
  - StakeManagerStorage: `0xFd98aac1Fbc57e6BC16A167452DBA7af2B6a4c0d`
  - Staking NFT: `0x8ae4Cb6a020121bCbD855fffc79A11984bE62B39`
- ผู้ใช้ขอ **หยุดและซ่อน UI ทั้งหมด** ของ feature นี้ก่อน จึงไม่มี `StakingPanel` หรือคอลัมน์ KUB stake บนหน้า production
- โค้ด research อยู่ใน `src/config/staking.ts`, `src/lib/staking.ts`, `src/hooks/useValidatorStaking.ts`, และ `src/components/StakingPanel.tsx` เพื่อใช้พิจารณาทำต่อภายหลัง ห้ามเปิดใช้โดยไม่ทบทวน UX/data scope ใหม่
- Verified `GKubToken` source has no lock/vesting/unlock mechanism; gKUB vote amount is burned, not unlockable.
- หากกลับมาทำใหม่ ต้องออกแบบ Phase 2 delegator stake ด้วย cache/sync เพราะการอ่าน ValidatorShare ของทุก validator และผู้โหวตจะชน rate limit ได้

## 11) ทำงานต่อด้วย OpenCode

- จุดเริ่มต้นสำหรับ agent/ผู้พัฒนาคนถัดไปคือ `OPENCODE.md`; ให้อ่านไฟล์นี้ควบคู่กับ HANDOFF เสมอ
- รัน `git status --short` ก่อนแก้ และอย่าลบ untracked Pixel assets โดยไม่ยืนยันจากผู้ใช้
- ก่อน publish ให้รัน `npm run build`; หากเป็นการเปลี่ยน data/tally ให้รัน `npm run verify` เพิ่ม
- push `main` จะ deploy ไป GitHub Pages จาก `.github/workflows/deploy.yml`; หลัง push ต้องเช็ค Actions และเว็บจริง

## 12) Git

- HEAD เดิม: `a2a28bf` (Pixel palette) — มีงาน Pixel theme/documentation ที่ยังไม่ commit ใน working tree
- remote: `nattawutvisayataksin/kub-council-report-glm` (main, deploy via Actions)
- เหลือไฟล์ชั่วคราวเว้นหน้า repo: none (ทดสอบอ่าน token อ่านแล้วลบ)

# KUB Council Report — GLM 🗳️

⚡ **Power by VeeNagi** (ผู้พัฒนา)

Dashboard เกาะติด **ผลโหวตจริงจากบล็อกเชน** ของ **KUB Community Council Election Round 2**
บน KUB Chain Mainnet (Chain ID **96**) — read-only 100% ไม่ผูกกระเป๋าเงิน ไม่มี API key

> ตัวเลขทุกตัวบนหน้าเว็บมาจาก `ProposalVoted` logs ของ contract จริง + view calls
> แล้ว cross-check กับ API อย่างเป็นทางการ (`kubcouncil.vercel.app/api/votes`) ทุกรอบ
> (อัปเดตอัตโนมัติทุก ~15 วินาที)

> ดูคู่มือทำงานต่อด้วย OpenCode ที่ [`OPENCODE.md`](./OPENCODE.md) และสรุปสถานะเชิงเทคนิคที่ [`HANDOFF.md`](./HANDOFF.md)

---

## โปรเจกต์นี้ "ยืนยันได้" อย่างไร (verification trail)

| ข้อ | ข้อมูล | ค่า | แหล่งยืนยัน |
|---|---|---|---|
| 1 | Contract ผลโหวต | `0x5aF70a51ddbb02e717540Dcda351706a1589F5B1` (`GKubProposalV2`) | kubscan `getsourcecode` (compiler v0.8.17, optimization 20000, IsProxy=false) + เป็น owner ทุก proposal ของรอบนี้ |
| 2 | gKUB vote token | `0x5848718437583e7a086c97836344aa43bfa55dab` | ผ่าน 3 ชั้น: ① constructor args (kubscan) ② receipt ของ tx โหวตจริงแสดง KAP20 `Transfer(user → address(0))` จาก contract นี้ ③ source ของ `voteProposal` เรียก `voteToken.burn(user, amount)` |
| 3 | event คะแนน | `ProposalVoted(proposalId, choice, user, gKubAmount)` topic0 = `0xf3801d77e9bff0fe5c3de5dfbdbe6cf3d04bb3e22005abfe7bf389dc78476fd1` | ตรวจจาก log จริง 24 events ในช่วงเลือกตั้ง (แอปยัง re-derive จาก ABI ตอนรันด้วย viem อัตโนมัติ) |
| 4 | ช่วงเลือกตั้ง | เริ่ม `1792558800` (21 ต.ค. 2026 12:00 น. ICT) → ปิด `1794286800` (10 พ.ย. 2026 12:00 น. ICT) | `createProposal` args บนเชน + `/api/votes` |
| 5 | anchor block | proposals 15–19 ถูกสร้าง block `36255246–36255256`, เริ่มโหวต ~block `36306869` | binary search timestamps + kubscan txlist |
| 6 | คะแนน | tally ต่อ (proposal, choice) **ตรงกับ /api/votes เป๊ะทุกตัว** + ตรงกับ `getProposalInfoById().choiceVoted` (state บนเชน) | `scripts/verify.ts` (`npm run verify`) — ผลรวม ณ 22 ต.ค. 2026: 119 / 278.33 / 106 / 141.7737 / 81 gKUB |

### ทำไม tally = ผลรวม `ProposalVoted` ได้เลย

- source ของ GKubProposalV2 (flattened, 28,835 bytes) แสดงว่า **ไม่มีการลด** `choiceVoted[]`/`totalVoted`
  ทั้งโครงสร้าง (มีแต่ `+=` ใน `voteProposal`) — withdrawal (`withdrawVoteToken`) แค่คืน token
  และ mark `isWithdraw` ไม่กระทบคะแนนบนเชน
- การโหวต "เผา" gKUB (`voteToken.burn`) ทำให้คะแนนเป็น additive จริง ย้อนเป็น replay ได้แน่นอน
- แอปจึงใช้ **ผลรวม events** และ **view state** ไปทางเดียวกัน — และแจ้ง `.tallyMatchesView`/`.tallyMatchesApi`
  ต่อข้อเป็น badge บนหน้าเว็บ

### ชื่อผู้สมัคร

ชื่อจริงของผู้สมัครอยู่ใน `/api/votes` (cross-validated ว่า **index ของ choice บนเชน == index ของ options**
ใน API — พิสูจน์ด้วย numOfChoice 4 ของข้อ #16 และตัวเลข per option ที่ตรงกันทั้ง 5 ข้อ)
ถ้า API ล่มขณะ RPC ยังอยู่ แอปจะแสดงแฟลลแบ็กข้อความ `ตัวเลือก N` แทน ไม่เดาชื่อ

---

## สถาปัตยกรรมข้อมูล (how it works)

```
 ┌──────────────────────── KUB Chain Mainnet (rpc.kubchain.io, chain 96) ───────────────────────┐
 │  eth_getLogs (address-only, chunked 4000 บล็อก)      readContract (viem)                    │
 │  → ProposalVoted / ProposalCreated / ProposalClosed   → getProposalInfoById(id) x5 → state  │
 │    / ProposalCompleted / VoteTokenWithdrawn           → voteToken() → ตรวจ gKUB address      │
 └──────────────────────────────┬───────────────────────────────────────────────────────────────┘
                                │ merge + dedupe + tally (BigInt exact แบบ wei)
                                ▼
              ElectionModel { proposals, votes[], refunds[], uniqueVoters … }
                                ▲
                                │ cross-check (ชื่อผู้สมัคร + เทียบตัวเลข)
              https://kubcouncil.vercel.app/api/votes
                                ▼
        React UI: countdown, การ์ด 5 หมวด + กราฟแท่ง, donut/timeline stats,
        Analytics ต่อกระเป๋า (คะแนนเผา + balanceOf), ธุรกรรมล่าสุด, Export CSV ×3, RPC status+block
```

- **initial scan**: จาก block `36255000` → latest (~22 chunks ของ 4000 บล็อก)
- **incremental poll ทุก 15 วิ**: สแกนเฉพาะเงา block ใหม่ ต่อจาก scan ล่าสุด (เร็ว ประหยัด RPC)
- **โหมด fallback**: ถ้า RPC ล่ม → ใช้ API snapshot (มี banner เหลืองระบุที่มา+timestamp) ถ้า API ก็ล่มด้วย →
  banner แดง + ปุ่ม retry (ไม่มี mock data หลอก)

## ฟีเจอร์

- ตัวเลขคะแนน gKUB ต่อผู้สมัคร (exact wei formatting ไม่ปัดเศษ), จำนวนผู้โหวตไม่ซ้ำ, อันดับ, กราฟแท่ง + %
- Status quorum (ผ่าน/ยังไม่ผ่าน 20 gKUB) และสถานะ proposal (เปิดโหวต / ผ่านเกณฑ์ / ปิด)
- Countdown ปิดรับโหวต 10 พ.ย. 2026 12:00 น. (ไทย) + progress bar ของช่วงโหวต
- **Analytics ผู้โหวต**: ตารางรวมทุกกระเป๋าที่ลงโหวต — คะแนนที่เผา (exact wei), จำนวน tx, หมวดที่ลง,
  ยอด gKUB จริงในกระเป๋า ณ ปัจจุบัน (`balanceOf` อ่านสดจากเชน แบบ sequential ทยอยทีละใบ —
  กด expand ดูประวัติโหวตทุกรายการพร้อมลิงก์ kubscan)
- **Token stats**: name/symbol/decimals/totalSupply ของ gKUB อ่านจากเชน
  (จริงแล้ว = "G KUB Token" · GKT · decimals 18) + สัดส่วนที่ถูกเผาเพื่อโหวต
- **กราฟ/สถิติ**: Donut การกระจายคะแนนตามหมวด + Timeline เผา gKUB สะสมตามเวลา
  (SVG วาดเอง ไม่เพิ่ม chart library)
- Export CSV สามไฟล์: *ผลสรุป* ต่อ (ข้อ, ตัวเลือก) / *ทุกธุรกรรมโหวต* / *ต่อผู้โหวต* (มี tx hash + URL)
- รายการธุรกรรมโหวตล่าสุด (block time, ผู้โหวต, ผู้สมัคร, คะแนน, link kubscan)
- สถานะ RPC, block number ล่าสุด, อัปเดตล่าสุดเมื่อ x วินาทีก่อน, badge cross-check
- ธีม classic dark/neon-green และธีม **Pixel Arts** ที่สลับจากปุ่มมุมขวาบน (จำค่าไว้ใน browser)
- ธีม Pixel ใช้ artwork ที่สร้างด้วย PixelLab: hero banner นักผจญภัยชาย 5 คน, wordmark KUB และ creator credit ของ VeeNagi

## รันเอง

```bash
npm install
npm run dev        # dev server
npm run build      # typecheck + build → dist/
npm run verify     # พิสูจน์ end-to-end: อ่านเชนจริง + เทียบ /api/votes (ถ้าไม่ผ่านจะ exit 1)
npm run preview    # เสิร์ฟ dist/ ที่ build แล้ว
```

### ออกแบบ Pixel artwork (PixelLab)

- การตั้งค่า MCP ของ workspace อยู่ที่ `.vscode/mcp.json` และอ่าน credential จาก environment variable `PIXELLAB_TOKEN` เท่านั้น
  (ห้าม commit token)
- กติกาและขอบเขตงานภาพอยู่ที่ `.github/instructions/pixel-design.instructions.md`
- สร้าง artwork ซ้ำ: `scripts/gen-pixel-brand-assets.ps1` (logo/hero) หรือ
  `scripts/gen-pixel-party-banner.ps1` (hero อย่างเดียว) โดยต้องกำหนด `PIXELLAB_TOKEN` ก่อน
- Asset ที่ใช้งานจริงเก็บใน `src/assets/pixel/`; งานภาพต้องไม่แก้ logic อ่านเชนหรือเพิ่ม RPC concurrency

> บน Windows Vite ถูกตั้งให้ใช้ polling watcher ใน `vite.config.ts` เพื่อหลีกเลี่ยง `EBUSY` เมื่อไฟล์ asset ถูกล็อกชั่วคราว

### Environment variables (ทางเลือกทั้งหมด)

คัดลอก `.env.example` → `.env` แล้วแก้ได้ ไม่มีไฟล์ก็รันได้เพราะมี default:

| ตัวแปร | Default | คำอธิบาย |
|---|---|---|
| `VITE_RPC_URL` | `https://rpc.kubchain.io` | RPC ของ KUB Chain Mainnet |
| `VITE_API_FALLBACK_URL` | `https://kubcouncil.vercel.app/api/votes` | API สำหรับ cross-check + ชื่อผู้สมัคร |

## Deploy: GitHub + GitHub Pages (แนะนำ — รันบนเว็บ GitHub โดยตรง)

1. push โปรเจกต์นี้ขึ้น GitHub (repo ใหม่ public — ชื่อแนะนำ `kub-council-report-glm`) เช่น
```bash
git init
git add -A
git commit -m "KUB Council Report GLM v1.0"
# สร้าง repo เปล่า (ไม่ต้อง init README) บน github.com แล้ว:
git remote add origin https://github.com/<USER>/kub-council-report-glm.git
git push -u origin main
```
2. เปิด **Settings → Pages → Source = "GitHub Actions"** (ทำครั้งเดียว)
3. ทุก push บน main workflow `.github/workflows/deploy.yml` จะ build + deploy ให้เอง
   URL: `https://<USER>.github.io/kub-council-report-glm/`
   (vite.config ตั้ง `base: "./"` ไว้แล้ว — ทำงานกับ subpath รวมถึง root ได้ทั้งคู่)

> CORS ทราบล่วงหน้า: RPC ของ KUB Chain เปิด `Access-Control-Allow-Origin: *` (อ่านเชนจาก browser ได้ปกติ)
> แต่ API kubcouncil ไม่แนบ CORS — หน้าเว็บจึงใช้ "ชื่อผู้สมัคร" ที่ตั้งฝังไว้ใน config
> (ยืนยัน index กับเชนแล้ว — ดู comment ใน `src/config/election.ts`) ส่วนคะแนนทุกตัวยังมาจากเชนจริง

## Deploy: Netlify (ทางเลือก, ถ้ายังอยากใช้ Netlify)

1. บน [Netlify](https://app.netlify.com) เลือก **Add site → Import from Git → เลือก repo**
2. Build command และ publish dir ดึงจากไฟล์ `netlify.toml` อัตโนมัติ:
   - Build command: `npm run build`
   - Publish: `dist`
3. (ไม่ต้องตั้ง env ใด ๆ ใน Netlify เว้นแต่จะเปลี่ยน RPC — ทุก endpoint เป็น public)

หรือ deploy แบบเร็ว (`npm i -g netlify-cli`):
```bash
netlify deploy --build --prod
```

## ข้อจำกัด / คำชี้แจง

- เว็บนี้ **ไม่ใช่ทรัพย์สินทางการ** ของ KUB / Kub Chain — เป็นเครื่องมือรายงานแบบ public interest
- ข้อมูลมาจากบล็อกเชนสาธารณะ 100% (read-only) — ธุรกรรมโหวตเปิดดูได้เองบน kubscan ทุกครั้งผ่านลิงก์
- gKUB decimals = 18 (พิสูจน์โดยนัย: minQuorum `20e18` == "20" ใน API และคะแนนตรงเป๊ะทุกตัว)
- สัญลักษณ์ token จริงบนเชนคือ **"G KUB Token" (GKT)** — แอปแสดง name/symbol จากเชนสด
- **ยอด gKUB ในกระเป๋า** ใช้ `balanceOf` อ่านสดจากเชน — เช็คเฉพาะกระเป๋าที่ลงโหวตเทิร์นนี้
  (ไม่ใช่ทุกกระเป๋าทั้งเชนทั้งหมด เพราะ RPC สาธารณะไม่อนุญาตให้สแกน Transfer logs ทั้ง token
  ตั้งแต่ genesis ได้ในขอบเขต endpoint นี้)
- **rpc.kubchain.io มี rate limit** ("Request exceeds defined limit." เมื่อยิง burst พร้อมกัน) —
  ระบบอ่าน balance ต้องแบบ sequential เว้น ~420ms ต่อใบ + retry/backoff (ผ่านการทดสอบ 22/22 ครบ)
  ถ้ากระเป๋าไหนอ่านไม่สำเร็จ UI จะแสดง "—" พร้อมคำอธิบาย ไม่เดาตัวเลข
- ยอด "ในกระเป๋า" คือยอด **ณ อ่านล่าสุด** (โหวตถูก burn ทันที จึงไม่รวมอยู่ในยอด) —
  auto refresh ทุก ~5 นาที และกดปุ่มรีเฟรชได้ตลอด
- API อย่างเป็นทางการอาจไม่ได้แสดง "ตัวเลข" แบบตรง timing เดียวกับการอ่านเชนเสมอ — ระบบจะแจ้ง
  `apiUpdatedAt` และแอปให้ความสำคัญกับค่า on-chain เป็นหลักเสมอ

## โครงสร้างไฟล์

```
Kub-Council-Report-GLM/
├─ scripts/verify.ts        # พิสูจน์ end-to-end (npm run verify)
├─ scripts/gen-pixel-*.ps1  # สร้าง artwork PixelLab ซ้ำ (ใช้ PIXELLAB_TOKEN)
├─ .vscode/mcp.json         # PixelLab MCP config (token ผ่าน environment variable)
├─ .github/instructions/    # กติกาการออกแบบ Pixel-theme
├─ src/
│  ├─ components/           # Header, Countdown, StatsPanel (donut+timeline), ProposalCard, TxFeed, WalletTable, Banners, Footer
│  ├─ hooks/useElection.ts  # polling 15 วิ + incremental scan
│  ├─ hooks/useCountdown.ts
│  ├─ hooks/useWalletAnalytics.ts  # balanceOf ทุกกระเป๋า แบบ sequential + progress
│  ├─ lib/
│  │  ├─ election.ts        # ระบบข้อมูลเหนือเชน (framework-free)
│  │  ├─ analytics.ts       # สถิติต่อ wallet / timeline เผา / การกระจายตามหมวด
│  │  ├─ token.ts           # อ่าน gKUB (KAP20): info + balanceOf + retry
│  │  ├─ client.ts          # viem client (KUB Chain)
│  │  ├─ api.ts             # cross-check kubcouncil API
│  │  ├─ format.ts          # exact wei math + เวลา/BKK
│  │  ├─ export.ts / csv.ts # CSV สามแบบ (ผลสรุป / ธุรกรรมโหวต / ต่อผู้โหวต)
│  ├─ config/chain.ts       # KUB Chain (viem) + explorer helpers
│  ├─ config/election.ts    # contract/gKUB/ABI + **ข้อมูลยืนยัน** (อ่าน comment ข้างใน)
│  ├─ assets/pixel/         # PixelLab artwork + KUB/VeeNagi wordmarks
│  ├─ App.tsx / main.tsx / styles.css / pixel-theme.css
├─ index.html · vite.config.ts · tsconfig.json · netlify.toml · .env.example
```

/**
 * ============================================================
 *  i18n core — ไม่ผูกกับ React (lib/hooks ก็เรียกได้)
 * ============================================================
 * - ภาษาปัจจุบันเก็บใน module state + localStorage (`kub-council-lang`)
 * - Provider ฝั่ง React อยู่ที่ src/i18n/index.tsx (sync ค่า + document lang)
 * - key ที่หาไม่เจอจะย้อนไป th ก่อน แล้วค่อยคืน key เดิม
 */

export type Lang = "th" | "en";

export const LANG_STORAGE_KEY = "kub-council-lang";

let current: Lang = "th";

export function currentLang(): Lang {
  return current;
}

export function setLang(l: Lang): void {
  current = l;
}

type Dict = Record<string, string>;

const th: Dict = {
  // ---- App ----
  "loading-first": "กำลังอ่านข้อมูลจากบล็อกเชน KUB Chain…",
  "loading-refresh": "กำลังอัปเดตข้อมูล…",
  "loading-sub": "สแกน ProposalVoted logs + cross-check API — ใช้เวลาเพียงสักครู่",
  "loading-firstvisit":
    "ครั้งแรกต้องสแกนบล็อกทั้งช่วงเลือกตั้ง (มือถือ/เครือข่ายช้าอาจใช้เวลา 1–2 นาที) — ครั้งถัดไปจะเร็วขึ้นมาก เพราะเก็บผลอ่านล่าสุดไว้ในเครื่องนี้แล้ว",

  // ---- Header ----
  "header.subtitle":
    "รายงานผลโหวตจริงที่อ่านจากบล็อกเชน KUB Chain Mainnet (Chain ID 96) · read-only · ไม่ใช่เว็บทางการ",
  "chip.live": "On-chain live",
  "chip.fallback": "API snapshot fallback",
  "chip.offline": "ไม่มีการเชื่อมต่อ",
  "chip.block": "ก้อน {n}",
  "chip.crossOk": "Cross-check /api/votes ✓ ตรงทุกตัว",
  "chip.crossFail": "Cross-check คลาดเคลื่อน — ตรวจ console",
  "chip.updated": "อัปเดตล่าสุด: {t}",
  "btn.refresh": "อัปเดตตอนนี้",
  "btn.refreshing": "กำลังอัปเดต…",
  "btn.share": "แชร์ผลโหวต",
  "share.done": "✓ คัดลอกลิงก์แล้ว",
  "share.text":
    "ผลโหวตจริงจากบล็อกเชน — KUB Community Council Election Round 2",

  // ---- CountdownCard ----
  "cd.cat": "นาฬิกา",
  "cd.openTitle": "⏳ นับถอยหลังปิดรับโหวต",
  "cd.closedTitle": "🔒 ปิดรับโหวตแล้ว",
  "cd.closesAt": "ปิดรับโหวต: {d} (เวลาไทย)",
  "cd.finalNote": "ผลโหวตสุดท้ายอยู่ด้านล่าง (ค่าจากบล็อกเชน)",
  "cd.u.days": "วัน",
  "cd.u.hours": "ชั่วโมง",
  "cd.u.mins": "นาที",
  "cd.u.secs": "วินาที",
  "cd.opened": "เปิดโหวต {d}",
  "cd.pctSpan": "{p}% ของช่วงเวลาโหวต",

  // ---- SummaryStrip ----
  "sum.proposals": "ข้อเลือกตั้ง (1 ที่นั่ง/ข้อ)",
  "sum.voters": "ผู้โหวตไม่ซ้ำทั้งเทิร์น",
  "sum.tx": "ธุรกรรมโหวตบนเชน",
  "sum.burn": "gKUB ถูกเผารวม (bonfire)",
  "sum.quorum": "ผ่าน quorum (20 gKUB)",
  "exp.summary": "⬇ Export: ผลสรุป (CSV)",
  "exp.detail": "⬇ Export: แหล่งธุรกรรมโหวต (CSV)",
  "exp.wallets": "⬇ Export: ต่อผู้โหวต (CSV)",

  // ---- StatsPanel ----
  "sp.cat": "สถิติ · กราฟ",
  "sp.donutTitle": "การกระจายคะแนนตามหมวด",
  "sp.donutNote":
    "คะแนนรวมต่อ \"ข้อ\" = ทุกตัวเลือกในข้อนั้นรวม abstain · หน่วย gKUB ถูกเผาตรงช่องนั้น",
  "sp.tlTitle": "เผา gKUB สะสมตามเวลา",
  "sp.tlNote": "แต่ละจุด = ธุรกรรมโหวต 1 รายการ (hover เพื่อดูเวลา)",
  "sp.tlCount": "สะสม {n} tx",
  "sp.tlEmpty":
    "ยังไม่มีธุรกรรมโหวตที่มี timestamp — ระบบจะวาดกราฟเมื่อมีข้อมูลจากเชน",
  "sp.pillApi": "ค่าจาก API snapshot",
  "sp.pillOnchain": "ต้องมี on-chain",
  "sp.aria.donut": "การกระจายคะแนนตามหมวด",
  "sp.aria.timeline": "เผา gKUB สะสมตามเวลา",
  "sp.cum": "gKUB สะสม",

  // ---- ProposalCard ----
  "pc.open": "เปิดโหวตอยู่",
  "pc.completed": "เสร็จสมบูรณ์ ✓",
  "pc.closed": "ปิด (ไม่ถึง quorum)",
  "pc.wait": "รอปิดผล",
  "pc.item": "ข้อ #{id}",
  "pc.pctOfItem": "{p}% ของคะแนนข้อนี้",
  "pc.leader": "· ผู้นำ",
  "pc.voters": "ผู้โหวต {n} คน (ไม่ซ้ำ)",
  "pc.total": "รวม",
  "pc.quorumPassed": "ผ่าน ✓",
  "pc.quorumNotYet": "ยังไม่ผ่าน",
  "pc.nvoters": "ผู้โหวตไม่ซ้ำ",
  "pc.txcount": "ธุรกรรมโหวต",
  "pc.matchView": "ตรงกับ state บนเชน ✓",
  "pc.matchApi": "ตรงกับ /api/votes ✓",
  "pc.mismatchApi": "คลาดเคลื่อนกับ /api/votes",
  "pc.optionFallback": "ตัวเลือก {n}",

  // ---- TxFeed ----
  "tf.cat": "ธุรกรรม",
  "tf.title": "รายการโหวตจากบล็อกเชน",
  "tf.sortHintAll": "เรียงตาม {k} ({dir}) · คลิกหัวตารางเพื่อเปลี่ยน",
  "tf.sortHintLatest": "ล่าสุด {n} จาก {total} รายการ · คลิกหัวตารางเพื่อเรียง",
  "tf.dir.desc": "มาก→น้อย",
  "tf.dir.asc": "น้อย→มาก",
  "tf.showLatest": "⤡ แสดงเฉพาะ {n} ล่าสุด",
  "tf.showAll": "⤢ แสดงธุรกรรมทั้งหมด ({n})",
  "tf.all": "ทั้งหมด {n} รายการ",
  "tf.empty":
    "ยังไม่พบรายการโหวตใหม่ — ระบบจะเช็คอัตโนมัติจากเชนทุก ~15 วินาที",
  "tf.col.time": "เวลา (ไทย)",
  "tf.col.item": "ข้อเลือกตั้ง",
  "tf.col.choice": "ผู้สมัครที่เลือก",
  "tf.col.voter": "ผู้โหวต",
  "tf.col.amount": "คะแนน (gKUB)",
  "tf.refundHead": "การคืน gKUB (VoteTokenWithdrawn) {n} รายการ — หมายเหตุ: ซอร์สโค้ดยืนยันว่าการ withdraw",
  "tf.refundNote": "ไม่ลด choiceVoted/totalVoted บนเชน (คะแนนที่ \"เผา\" ไปแล้วยังนับตามเดิม)",
  "k.time": "เวลา",
  "k.item": "ข้อ",
  "k.choice": "ผู้สมัครที่เลือก",
  "k.voter": "ผู้โหวต",
  "k.amount": "คะแนน",
  "wt.k.item": "ข้อ",
  "wt.k.choice": "เลือก",
  "wt.k.score": "คะแนน",

  // ---- WalletTable ----
  "wt.title": "ผู้โหวตทุกกระเป๋า — คะแนนที่เผา + ยอด gKUB ในกระเป๋า",
  "wt.walletCount": "{n} กระเป๋า (จาก ProposalVoted logs)",
  "wt.chipKnown": "ยอด gKUB: {a}/{b} อ่านสด",
  "wt.btnRead": "⟲ ยอด gKUB ทุกกระเป๋า",
  "wt.btnReading": "กำลังอ่านเชน… {d}/{n}",
  "wt.btnReadingPlain": "กำลังอ่านเชน…",
  "wt.supply": "Total supply (ปัจจุบัน):",
  "wt.burnLabel": "เผาเพื่อโหวต",
  "wt.burnPct": "≈ {p}% ของยอดก่อนโหวต",
  "wt.decimalsWarn": "⚠ decimals={d} (แอปคำนวณแบบ 18)",
  "wt.readAgo":
    "อ่านยอด ณ {n} วินาทีก่อน · รีเฟรชอัตโนมัติทุก ~5 นาที (อ่านทยอยทีละใบ กัน RPC rate limit)",
  "wt.reading": "กำลังอ่านยอดจากเชน…",
  "wt.missingNote":
    "⚠ อ่าน balanceOf ได้ {a}/{b} กระเป๋า — กระเป๋าที่ \"—\" แสดงว่า RPC ตอบไม่สำเร็จตอนนั้น (ไม่ได้แปลว่ายอดเป็น 0) กดปุ่มยอด gKUB เพื่อลองใหม่",
  "wt.empty": "ยังไม่มีข้อมูลโหวต — ระบบจะอ่านใหม่อัตโนมัติทุก ~15 วินาที",
  "wt.col.wallet": "กระเป๋า",
  "wt.col.balance": "gKUB ในกระเป๋า (ปัจจุบัน)",
  "wt.col.burned": "คะแนนที่เผา (gKUB)",
  "wt.col.cats": "หมวดที่ลง",
  "wt.exp.total": "คะแนนสะสม",
  "wt.exp.tx": "· โหวต {n} ธุรกรรม",
  "wt.exp.first": "· ครั้งแรก {d}",
  "wt.exp.last": "· ล่าสุด {d}",
  "wt.col.time": "เวลา (ไทย)",
  "wt.col.item": "ข้อ",
  "wt.col.choice": "เลือก",
  "wt.col.score": "คะแนน",
  "wt.footNote":
    "ยอด \"ในกระเป๋า\" คือ balanceOf ของ gKUB ณ ปัจจุบัน (สดจากเชน) — คะแนนโหวตถูก burn ไปแล้ว จึงไม่รวมอยู่ในยอดนี้ · ข้อจำกัด: เช็คเฉพาะกระเป๋าที่ลงโหวตเทิร์นนี้ ไม่ใช่ทุกกระเป๋าทั้งเชน",

  // ---- Banners ----
  "bn.fallbackTitle": "⚠ โหมด API snapshot:",
  "bn.fallback1": "ไม่สามารถติดต่อ RPC ของ KUB Chain ได้ตอนนี้ ระบบจึงแสดงผลจาก API ของหน้า kubcouncil (",
  "bn.fallback3": ") ซึ่งมาจากแหล่งเดียวกัน — ",
  "bn.fallbackUpdated": "ข้อมูล API ปรับปรุงที่ {t}",
  "bn.fallbackNoTs": "ไม่มี timestamp จาก API",
  "bn.fallbackFetched": " (ดึงเมื่อ {t})",
  "bn.fallbackRetry": " ระบบจะพยายามกลับไปอ่าน on-chain ทุก ~15 วินาที",
  "bn.unavailTitle": "⛔ ข้อมูลไม่พร้อมแสดง:",
  "bn.unavailBody":
    "ทั้ง RPC ของ KUB Chain และ API cross-check ไม่ตอบสนอง ได้ข้อมูลไม่ถูกต้องพอจะแสดงจริง แสดงข้อมูลเปล่า ไม่มี mock data — ระบบลองใหม่เองทุก 45 วินาที หรือกดปุ่ม",
  "bn.retry": "ลองอีกครั้ง",

  // ---- Theme / Lang toggles ----
  "tt.toPixel": "Click to Pixel Version",
  "tt.toClassic": "Click to Classic Version",
  "tt.title.toPixel": "สลับไปเวอร์ชัน Pixel Arts",
  "tt.title.toClassic": "กลับเวอร์ชันเดิม",
  "lang.title": "ภาษา / Language",

  // ---- format ----
  "ago.justnow": "เมื่อกี้นี้",
  "ago.sec": "{n} วินาทีที่แล้ว",
  "ago.min": "{n} นาทีที่แล้ว",
  "ago.hour": "{n} ชั่วโมงที่แล้ว",
};

const en: Dict = {
  // ---- App ----
  "loading-first": "Reading data from the KUB Chain blockchain…",
  "loading-refresh": "Updating data…",
  "loading-sub":
    "Scanning ProposalVoted logs + cross-checking the API — this takes a moment",
  "loading-firstvisit":
    "First visit scans the whole election's block history (may take 1–2 minutes on slow networks). Next visits are much faster — the latest scan result is cached on this device.",

  // ---- Header ----
  "header.subtitle":
    "Real on-chain vote results from KUB Chain Mainnet (Chain ID 96) · read-only · not an official site",
  "chip.live": "On-chain live",
  "chip.fallback": "API snapshot fallback",
  "chip.offline": "No connection",
  "chip.block": "Block #{n}",
  "chip.crossOk": "Cross-check /api/votes ✓ all match",
  "chip.crossFail": "Cross-check mismatch — see console",
  "chip.updated": "Updated {t}",
  "btn.refresh": "Refresh now",
  "btn.refreshing": "Updating…",
  "btn.share": "Share results",
  "share.done": "✓ Link copied",
  "share.text":
    "Live on-chain vote results — KUB Community Council Election Round 2",

  // ---- CountdownCard ----
  "cd.cat": "Clock",
  "cd.openTitle": "⏳ Countdown to voting close",
  "cd.closedTitle": "🔒 Voting closed",
  "cd.closesAt": "Voting closes: {d} (Bangkok time)",
  "cd.finalNote": "Final results are below (on-chain values)",
  "cd.u.days": "Days",
  "cd.u.hours": "Hours",
  "cd.u.mins": "Min",
  "cd.u.secs": "Sec",
  "cd.opened": "Voting opened {d}",
  "cd.pctSpan": "{p}% of the voting window",

  // ---- SummaryStrip ----
  "sum.proposals": "Election items (1 seat each)",
  "sum.voters": "Unique voters this round",
  "sum.tx": "On-chain vote transactions",
  "sum.burn": "gKUB burned in total (bonfire)",
  "sum.quorum": "Meeting quorum (20 gKUB)",
  "exp.summary": "⬇ Export: summary (CSV)",
  "exp.detail": "⬇ Export: all vote transactions (CSV)",
  "exp.wallets": "⬇ Export: per voter (CSV)",

  // ---- StatsPanel ----
  "sp.cat": "Stats · Graphs",
  "sp.donutTitle": "Score distribution by category",
  "sp.donutNote":
    "Total per item = sum of all options including abstain · gKUB burned in that option",
  "sp.tlTitle": "Cumulative gKUB burned over time",
  "sp.tlNote": "Each point = 1 vote transaction (hover to see the time)",
  "sp.tlCount": "{n} tx total",
  "sp.tlEmpty":
    "No vote transactions with timestamps yet — the chart will appear once chain data arrives",
  "sp.pillApi": "Values from API snapshot",
  "sp.pillOnchain": "Needs on-chain",
  "sp.aria.donut": "Score distribution by category",
  "sp.aria.timeline": "Cumulative gKUB burned over time",
  "sp.cum": "gKUB cumulative",

  // ---- ProposalCard ----
  "pc.open": "Voting open",
  "pc.completed": "Completed ✓",
  "pc.closed": "Closed (quorum not met)",
  "pc.wait": "Awaiting close",
  "pc.item": "item #{id}",
  "pc.pctOfItem": "{p}% of this item's votes",
  "pc.leader": "· Leader",
  "pc.voters": "{n} voters (unique)",
  "pc.total": "Total",
  "pc.quorumPassed": "Met ✓",
  "pc.quorumNotYet": "Not yet",
  "pc.nvoters": "Unique voters",
  "pc.txcount": "Vote transactions",
  "pc.matchView": "Matches on-chain state ✓",
  "pc.matchApi": "Matches /api/votes ✓",
  "pc.mismatchApi": "Mismatch with /api/votes",
  "pc.optionFallback": "Option {n}",

  // ---- TxFeed ----
  "tf.cat": "Transactions",
  "tf.title": "On-chain vote records",
  "tf.sortHintAll": "Sorted by {k} ({dir}) · click a header to change",
  "tf.sortHintLatest": "Latest {n} of {total} · click a header to sort",
  "tf.dir.desc": "high→low",
  "tf.dir.asc": "low→high",
  "tf.showLatest": "⤡ Show latest {n} only",
  "tf.showAll": "⤢ Show all transactions ({n})",
  "tf.all": "{n} total",
  "tf.empty":
    "No new votes yet — the system checks the chain automatically every ~15 seconds",
  "tf.col.time": "Time (BKK)",
  "tf.col.item": "Item",
  "tf.col.choice": "Choice",
  "tf.col.voter": "Voter",
  "tf.col.amount": "Votes (gKUB)",
  "tf.refundHead":
    "gKUB refunds (VoteTokenWithdrawn) {n} records — note: verified source code confirms withdrawing does",
  "tf.refundNote":
    "not reduce on-chain choiceVoted/totalVoted (burned scores still count as before)",
  "k.time": "time",
  "k.item": "item",
  "k.choice": "choice",
  "k.voter": "voter",
  "k.amount": "votes",
  "wt.k.item": "item",
  "wt.k.choice": "choice",
  "wt.k.score": "votes",

  // ---- WalletTable ----
  "wt.title": "All voter wallets — burned votes + current gKUB balance",
  "wt.walletCount": "{n} wallets (from ProposalVoted logs)",
  "wt.chipKnown": "Balances: {a}/{b} live",
  "wt.btnRead": "⟲ Re-read all gKUB balances",
  "wt.btnReading": "Reading chain… {d}/{n}",
  "wt.btnReadingPlain": "Reading chain…",
  "wt.supply": "Total supply (current):",
  "wt.burnLabel": "Burned for votes",
  "wt.burnPct": "≈ {p}% of pre-vote supply",
  "wt.decimalsWarn": "⚠ decimals={d} (app assumes 18)",
  "wt.readAgo":
    "Read {n}s ago · auto-refreshes every ~5 min (sequential reads to avoid RPC rate limits)",
  "wt.reading": "Reading balances from the chain…",
  "wt.missingNote":
    "⚠ Read balanceOf for {a}/{b} wallets — \"—\" means the RPC did not respond at that time (it does NOT mean zero); press the gKUB button to retry",
  "wt.empty": "No vote data yet — the system re-reads automatically every ~15 seconds",
  "wt.col.wallet": "Wallet",
  "wt.col.balance": "gKUB balance (current)",
  "wt.col.burned": "Burned votes (gKUB)",
  "wt.col.cats": "Categories",
  "wt.exp.total": "Cumulative score",
  "wt.exp.tx": "· {n} transactions",
  "wt.exp.first": "· First {d}",
  "wt.exp.last": "· Latest {d}",
  "wt.col.time": "Time (BKK)",
  "wt.col.item": "Item",
  "wt.col.choice": "Choice",
  "wt.col.score": "Votes",
  "wt.footNote":
    "\"In wallet\" = live gKUB balanceOf right now — the vote score was burned, so it is not included · Limitation: only wallets that voted in this round are checked, not every wallet on the chain",

  // ---- Banners ----
  "bn.fallbackTitle": "⚠ API snapshot mode:",
  "bn.fallback1":
    "The KUB Chain RPC is unreachable right now, so this page shows values from the kubcouncil API (",
  "bn.fallback3": ") from the same source — ",
  "bn.fallbackUpdated": "API updated at {t}",
  "bn.fallbackNoTs": "no timestamp from API",
  "bn.fallbackFetched": " (fetched {t})",
  "bn.fallbackRetry":
    " The system keeps retrying on-chain every ~15 seconds",
  "bn.unavailTitle": "⛔ Data unavailable:",
  "bn.unavailBody":
    "Both the KUB Chain RPC and the cross-check API are not responding. Nothing reliable to show — no mock data. It retries automatically every 45 seconds, or press",
  "bn.retry": "Try again",

  // ---- Theme / Lang toggles ----
  "tt.toPixel": "Click to Pixel Version",
  "tt.toClassic": "Click to Classic Version",
  "tt.title.toPixel": "Switch to Pixel Arts version",
  "tt.title.toClassic": "Back to classic version",
  "lang.title": "ภาษา / Language",

  // ---- format ----
  "ago.justnow": "just now",
  "ago.sec": "{n}s ago",
  "ago.min": "{n} min ago",
  "ago.hour": "{n} h ago",
};

const dicts: Record<Lang, Dict> = { th, en };

/** แปล — คืนค่าจาก dict ของภาษาปัจจุบัน, หาไม่เจอย้อน th, สุดท้ายคืน key */
export function t(key: string, vars?: Record<string, string | number>): string {
  const val =
    dicts[current][key] ?? dicts.th[key] ?? key;
  if (!vars) return val;
  let s = val;
  for (const [k, v] of Object.entries(vars)) {
    s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  }
  return s;
}

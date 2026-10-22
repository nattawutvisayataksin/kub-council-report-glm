/** จัดรูปแบบตัวเลข/เวลา/ที่อยู่ — เวลาทั้งหมดอ้าง Asia/Bangkok (ICT) */

const GKUB_DECIMALS = 18;
const Q = 10n ** BigInt(GKUB_DECIMALS);

/** wei → สตริง gKUB แบบ "exact" ไม่ปัดเศษ — เช่น 278330000000000000000n → "278.33" */
export function weiToGkubString(wei: bigint): string {
  const neg = wei < 0n;
  const abs = neg ? -wei : wei;
  const intPart = (abs / Q).toString();
  const fracRaw = (abs % Q).toString().padStart(GKUB_DECIMALS, "0");
  const frac = fracRaw.replace(/0+$/, "");
  const s = frac ? `${intPart}.${frac}` : intPart;
  return neg ? `-${s}` : s;
}

export function weiToGkubNumber(wei: bigint): number {
  return parseFloat(weiToGkubString(wei));
}

/** สตริง gKUB ("278.33" จาก API) → exact wei — ใช้เทียบกับค่าบนเชนแบบไม่ปัดเศษ */
export function gkubStringToWei(v: string): bigint {
  const s = v.trim();
  const neg = s.startsWith("-");
  const body = neg ? s.slice(1) : s;
  const [intPart, fracPart = ""] = body.split(".");
  const int = intPart.replace(/[^0-9]/g, "") || "0";
  const frac = fracPart.replace(/[^0-9]/g, "").slice(0, GKUB_DECIMALS).padEnd(GKUB_DECIMALS, "0");
  const wei = BigInt(int) * Q + BigInt(frac || "0");
  return neg ? -wei : wei;
}

/** เทียบค่า gKUB สองฝั่งแบบมี tolerance ~1e-6 gKUB (กัน error เชิงเลขข้อความ) */
export function compareWeiTol(a: bigint, b: bigint, tolWei: bigint = 10n ** 12n): boolean {
  const d = a > b ? a - b : b - a;
  return d <= tolWei;
}

export function fmtNum(n: number | string, maxFrac = 4): string {
  const num = typeof n === "string" ? parseFloat(n) : n;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: maxFrac }).format(num);
}

export function fmtPct(p: number): string {
  return `${fmtNum(p, 1)}%`;
}

export function shortAddr(addr: string): string {
  return addr.length <= 12 ? addr : `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const bkkDate = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const bkkTime = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const bkkShort = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** "21 ต.ค. 2566 12:00 น." */
export function fmtDateTime(tsSeconds: number): string {
  const d = new Date(tsSeconds * 1000);
  return `${bkkDate.format(d)} ${bkkTime.format(d)} น.`;
}

export function fmtDateTimeShort(tsSeconds: number): string {
  const d = new Date(tsSeconds * 1000);
  return `${bkkShort.format(d)} น.`;
}

export function fmtAgoSeconds(sec: number): string {
  if (sec < 5) return "เมื่อกี้นี้";
  if (sec < 60) return `${Math.floor(sec)} วินาทีที่แล้ว`;
  if ( sec < 3600) return `${Math.floor(sec / 60)} นาทีที่แล้ว`;
  return `${Math.floor(sec / 3600)} ชั่วโมงที่แล้ว`;
}

export interface CountdownParts {
  finished: boolean;
  days: number;
  hours: number;
  mins: number;
  secs: number;
}

export function countdownParts(targetTsSeconds: number, nowMs: number): CountdownParts {
  const diff = targetTsSeconds * 1000 - nowMs;
  if (diff <= 0) return { finished: true, days: 0, hours: 0, mins: 0, secs: 0 };
  const total = Math.floor(diff / 1000);
  return {
    finished: false,
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    mins: Math.floor((total % 3600) / 60),
    secs: total % 60,
  };
}

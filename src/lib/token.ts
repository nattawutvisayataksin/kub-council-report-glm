/**
 * ============================================================
 *  gKUB token (KAP20) — อ่านสดจากเชน
 * ============================================================
 * name / symbol / decimals / totalSupply / balanceOf
 *
 * ยอดในกระเป๋า (balanceOf) อ่านเฉพาะ "กระเป๋าที่ลงโหวตในเทิร์นนี้"
 * (มาจาก ProposalVoted logs — ดู src/lib/analytics.ts)
 *
 * ⚠ rpc.kubchain.io มี rate limit — ควรอ่าน balance แบบ sequential
 * เว้นระยะห่าง (ดู fetchBalanceOne) ไม่ยิงพร้อมกันเพียงพอกันไม่ได้
 */

import type { KubClient } from "./client";

export const KAP20_ABI = [
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export interface TokenInfo {
  name: string | null;
  symbol: string | null;
  /** fallback 18 ถ้าอ่านไม่สำเร็จ (gKUB ยืนยัน decimals = 18 จาก minQuorum 20e18) */
  decimals: number;
  totalSupplyWei: bigint | null;
}

/** เรียกหลายงานพร้อมกันแต่จำกัด จำนวนงานรันพร้อมกันสูงสุด = limit */
export function mapLimit<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const workerCount = Math.min(Math.max(1, limit), items.length);
  const worker = async (): Promise<void> => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]!);
    }
  };
  const workers: Promise<void>[] = [];
  for (let k = 0; k < workerCount; k++) workers.push(worker());
  return Promise.all(workers).then(() => out);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * balanceOf ใบเดียว พร้อม retry + backoff
 * คืน wei หรือ null ถ้าอ่านไม่สำเร็จครบทุกครั้ง
 *
 * สำคัญ: rpc.kubchain.io มี rate limit ("Request exceeds defined limit." เมื่อยิง burst
 * หลาย eth_call พร้อมกัน) — caller ควรเรียก sequential เว้น ~400ms ต่อใบ
 * (ผ่านการทดสอบ: sequential + 400ms = 22/22 ครบใน ~11 วิ, burst 6 ต่อชุด = เหลือ 6/22)
 */
export async function fetchBalanceOne(
  client: KubClient,
  token: string,
  wallet: string,
  opts?: { retries?: number; backoffMs?: number },
): Promise<bigint | null> {
  const retries = opts?.retries ?? 2;
  const backoff = opts?.backoffMs ?? 1200;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const bal = await client.readContract({
        address: token as `0x${string}`,
        abi: KAP20_ABI,
        functionName: "balanceOf",
        args: [wallet.toLowerCase() as `0x${string}`],
      });
      return BigInt(String(bal));
    } catch {
      if (attempt === retries) return null;
      await sleep(backoff * (attempt + 1));
    }
  }
  return null;
}

/** อ่าน metadata + totalSupply ของ token — ช่องไหน revert ให้ null (แสดง "—" ใน UI) */
export async function fetchTokenInfo(
  client: KubClient,
  token: string,
): Promise<TokenInfo> {
  const addr = token as `0x${string}`;
  const [name, symbol, decimals, supply] = await Promise.all([
    client
      .readContract({ address: addr, abi: KAP20_ABI, functionName: "name" })
      .catch(() => null),
    client
      .readContract({ address: addr, abi: KAP20_ABI, functionName: "symbol" })
      .catch(() => null),
    client
      .readContract({ address: addr, abi: KAP20_ABI, functionName: "decimals" })
      .catch(() => null),
    client
      .readContract({ address: addr, abi: KAP20_ABI, functionName: "totalSupply" })
      .catch(() => null),
  ]);
  return {
    name: name == null ? null : String(name),
    symbol: symbol == null ? null : String(symbol),
    decimals: decimals == null ? 18 : Number(decimals),
    totalSupplyWei: supply == null ? null : BigInt(String(supply)),
  };
}

/**
 * balanceOf หลายกระเป๋า — คืน map (lowercase address → wei) เฉพาะกระเป๋าที่อ่านสำเร็จ
 * กระเป๋าที่ fail จะไม่อยู่ใน map (caller แสดง "—" ได้จากการไม่พบ key)
 */
export async function fetchTokenBalances(
  client: KubClient,
  token: string,
  wallets: readonly string[],
  concurrency = 6,
): Promise<Map<string, bigint>> {
  const uniq = [...new Set(wallets.map((w) => w.toLowerCase()))];
  const results = await mapLimit(uniq, concurrency, async (w) => {
    try {
      const bal = await client.readContract({
        address: token as `0x${string}`,
        abi: KAP20_ABI,
        functionName: "balanceOf",
        args: [w as `0x${string}`],
      });
      return BigInt(String(bal));
    } catch {
      return null;
    }
  });
  const out = new Map<string, bigint>();
  results.forEach((v, i) => {
    if (v != null) out.set(uniq[i]!, v);
  });
  return out;
}

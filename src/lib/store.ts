/**
 * Local snapshot cache — เก็บผล scanning ครั้งล่าสุดไว้ที่เครื่องผู้ใช้ (localStorage)
 *
 * ปัญหาที่แก้: ช่วงการเลือกตั้งยาวขึ้นเรื่อย ๆ การสแกน log ครั้งแรกต้องเก็บ
 * หลายร้อย chunk (ต้องเว้นจังหวะเพราะ RPC มี rate limit) จนโหลดครั้งแรกช้ามาก
 * โดยเฉพาะมือถือ/เครือข่ายช้า
 *
 * วิธีระวังความจริงใจของข้อมูล: นี่ไม่ใช่ mock data — เป็นแค่ "ผลการอ่านจากเชนรอบก่อน"
 * ทุกครั้งที่เปิดแอประบบยัง:
 *   → สแกน block ใหม่ต่อจากเลขล่าสุด (incremental)  + อ่าน view state ล่าสุดจากเชน
 *   → cross-check กับ /api/votes ทุกรอบ → ค่าผิดพลาดจึงถูกจับ (mode ตามการตรวจจริง)
 * block timestamps เก็บ cache ต่อบล็อกเหมือนเดิม ทำให้ไม่ต้องยิง getBlock ซ้ยาว ๆ
 */

import type { RefundRow, VoteRow } from "./election";

const KEY = "kub-council-data-v1";
const VERSION = 1;

interface RowOut {
  key: string;
  txHash: string;
  block: number;
  blockTs: number | null;
  logIndex: number;
  proposalId: number;
  choice: number;
  voter: string;
  /** BigInt → string ตอนบันทึก */
  amountWei: string;
}

interface RefundRowOut {
  key: string;
  txHash: string;
  block: number;
  blockTs: number | null;
  proposalId: number;
  voter: string;
  amountWei: string;
}

export interface StoredSnapshot {
  version: number; // ต้องตรง VERSION ไม่งั้น cache ถูกลบ (กัน schema เก่าอ่านผิด)
  savedAtMs: number;
  /** block ล่าสุดที่สแกนถึง — ครั้งหน้าเริ่มจาก +1 */
  scannedTo: number;
  votes: RowOut[];
  refunds: RefundRowOut[];
  blockTsCache: Array<[number, number]>;
}

export interface HydratedSnapshot {
  savedAtMs: number;
  scannedTo: number;
  votes: VoteRow[];
  refunds: RefundRow[];
  blockTsCache: Map<number, number>;
}

function rowOut(r: VoteRow): RowOut {
  return {
    key: r.key,
    txHash: r.txHash,
    block: r.block,
    blockTs: r.blockTs,
    logIndex: r.logIndex,
    proposalId: r.proposalId,
    choice: r.choice,
    voter: r.voter,
    amountWei: r.amountWei.toString(),
  };
}

function rowIn(v: RowOut): VoteRow {
  return {
    key: v.key,
    txHash: v.txHash,
    block: v.block,
    blockTs: v.blockTs,
    logIndex: v.logIndex,
    proposalId: v.proposalId,
    choice: v.choice,
    voter: v.voter,
    amountWei: BigInt(v.amountWei),
  };
}

function refundOut(r: RefundRow): RefundRowOut {
  return {
    key: r.key,
    txHash: r.txHash,
    block: r.block,
    blockTs: r.blockTs,
    proposalId: r.proposalId,
    voter: r.voter,
    amountWei: r.amountWei.toString(),
  };
}

function refundIn(v: RefundRowOut): RefundRow {
  return {
    key: v.key,
    txHash: v.txHash,
    block: v.block,
    blockTs: v.blockTs,
    proposalId: v.proposalId,
    voter: v.voter,
    amountWei: BigInt(v.amountWei),
  };
}

export function saveElectionSnapshot(s: {
  savedAtMs: number;
  scannedTo: number;
  votes: VoteRow[];
  refunds: RefundRow[];
  blockTsCache: Map<number, number>;
}): void {
  try {
    if (typeof localStorage === "undefined") return;
    const body: StoredSnapshot = {
      version: VERSION,
      savedAtMs: s.savedAtMs,
      scannedTo: s.scannedTo,
      votes: s.votes.map(rowOut),
      refunds: s.refunds.map(refundOut),
      blockTsCache: [...s.blockTsCache.entries()],
    };
    localStorage.setItem(KEY, JSON.stringify(body));
  } catch {
    // quota/ปิดจาก setting — ข้ามไป ไม่แตะประสบการณ์
  }
}

export function loadElectionSnapshot(): HydratedSnapshot | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const body = JSON.parse(raw) as StoredSnapshot & { version?: number };
    if (body.version !== VERSION) return null;
    if (!Number.isFinite(body.scannedTo) || body.scannedTo <= 0) return null;
    if (!Array.isArray(body.votes)) return null;
    // ตรวจคร่าว ๆ: แต่ละแถวต้อง decode wei ได้เป็น BigInt
    const votes = body.votes.map(rowIn);
    const refunds = Array.isArray(body.refunds) ? body.refunds.map(refundIn) : [];
    const map = new Map<number, number>();
    if (Array.isArray(body.blockTsCache)) {
      for (const pair of body.blockTsCache) {
        if (Array.isArray(pair) && Number.isFinite(pair[0]) && Number.isFinite(pair[1])) {
          map.set(pair[0], pair[1]);
        }
      }
    }
    return { savedAtMs: body.savedAtMs, scannedTo: body.scannedTo, votes, refunds, blockTsCache: map };
  } catch {
    return null;
  }
}

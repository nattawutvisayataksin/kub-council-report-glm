/**
 * ============================================================
 *  Analytics engine (framework-free) — สร้างสถิติเหนือโมเดล election
 * ============================================================
 * อินพุตเดียวคือ ElectionModel (ข้อมูลจาก ProposalVoted logs บนเชน)
 * ไม่มีการเดาตัวเลข — ทุกค่า derive จากข้อมูลที่ยืนยันแล้วเท่านั้น
 */

import type { ElectionModel, VoteRow } from "./election";

// ---------------------------------------------------------------- wallets

export interface WalletVoteDetail {
  proposalId: number;
  category: string;
  choice: number;
  choiceName: string;
  amountWei: bigint;
  ts: number | null;
  block: number;
  txHash: string;
}

export interface WalletVoteStat {
  address: string; // lowercase
  totalWei: bigint; // คะแนน (gKUB เผาแล้ว) รวมทุกข้อ
  txCount: number;
  proposalIds: number[]; // ข้อที่ลงโหวต (ไม่ซ้ำ)
  firstTs: number | null; // โหวตครั้งแรก (block timestamp)
  lastTs: number | null; // โหวตครั้งล่าสุด
  /** ประวัติโหวตทุกรายการของกระเป๋านี้ (เก่า → ใหม่) */
  details: WalletVoteDetail[];
}

/** จัดกลุ่มโหวตตามกระเป๋า — เรียงตามคะแนนรวม (มาก → น้อย) */
export function buildWalletStats(model: ElectionModel): WalletVoteStat[] {
  const by = new Map<string, WalletVoteStat>();
  for (const v of model.votes) {
    let s = by.get(v.voter);
    if (!s) {
      s = {
        address: v.voter,
        totalWei: 0n,
        txCount: 0,
        proposalIds: [],
        firstTs: null,
        lastTs: null,
        details: [],
      };
      by.set(v.voter, s);
    }
    s.totalWei += v.amountWei;
    s.txCount += 1;
    if (!s.proposalIds.includes(v.proposalId)) s.proposalIds.push(v.proposalId);
    const ts = v.blockTs ?? null;
    if (ts != null && (s.firstTs == null || ts < s.firstTs)) s.firstTs = ts;
    if (ts != null && (s.lastTs == null || ts > s.lastTs)) s.lastTs = ts;

    const p = model.proposals.find((x) => x.id === v.proposalId);
    const o = p?.options.find((x) => x.idx === v.choice);
    s.details.push({
      proposalId: v.proposalId,
      category: p?.category ?? `ข้อ #${v.proposalId}`,
      choice: v.choice,
      choiceName: o?.name ?? `ตัวเลือก ${v.choice + 1}`,
      amountWei: v.amountWei,
      ts,
      block: v.block,
      txHash: v.txHash,
    });
  }
  const stats = [...by.values()];
  for (const s of stats) {
    s.details.sort(
      (a, b) => (a.ts ?? a.block) - (b.ts ?? b.block) || a.block - b.block,
    );
  }
  stats.sort(
    (a, b) =>
      (a.totalWei > b.totalWei ? -1 : a.totalWei < b.totalWei ? 1 : 0) ||
      b.txCount - a.txCount ||
      a.address.localeCompare(b.address),
  );
  return stats;
}

// ---------------------------------------------------------------- timeline

export interface TimelinePoint {
  ts: number; // block timestamp วินาที
  cumWei: bigint; // gKUB เผาสะสมตรงนั้น
  txIndex: number; // ธุรกรรมที่เท่าไหร่ของเทิร์น
}

/** ชุดจุดสำหรับกราฟ "เผา gKUB สะสมตามเวลา" */
export function buildBurnTimeline(votes: readonly VoteRow[]): TimelinePoint[] {
  const rows = [...votes]
    .filter((v) => v.blockTs != null && v.blockTs > 0)
    .sort(
      (a, b) =>
        (a.blockTs ?? 0) - (b.blockTs ?? 0) || a.logIndex - b.logIndex,
    );
  let cum = 0n;
  let i = 0;
  const pts: TimelinePoint[] = [];
  for (const r of rows) {
    cum += r.amountWei;
    pts.push({ ts: r.blockTs!, cumWei: cum, txIndex: ++i });
  }
  return pts;
}

// ---------------------------------------------------------------- distribution

export interface ProposalTotal {
  id: number;
  category: string;
  totalWei: bigint;
  pctOfAll: number;
}

/** คะแนนรวมต่อข้อ (ทุกตัวเลือกรวม abstain) — สำหรับ donut การกระจายตามหมวด */
export function buildProposalTotals(model: ElectionModel): {
  totals: ProposalTotal[];
  sumWei: bigint;
} {
  const sum = model.proposals.reduce((s, p) => s + p.totalVotedWei, 0n);
  const totals = model.proposals.map((p) => ({
    id: p.id,
    category: p.category,
    totalWei: p.totalVotedWei,
    pctOfAll:
      sum > 0n ? Number((p.totalVotedWei * 10000n) / sum) / 100 : 0,
  }));
  return { totals, sumWei: sum };
}

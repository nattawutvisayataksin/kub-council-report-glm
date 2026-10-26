/**
 * Analytics ผู้โหวต — รวมข้อมูล 2 แหล่งเป็นตารางเดียว:
 *   1) ProposalVoted logs → คะแนนที่เผา (skilled: exact wei), จำนวน tx, หมวดที่ลง, ประวัติรายการ
 *   2) balanceOf ของ gKUB (อ่านสดจากเชน) → ยอดในกระเป๋า ณ ปัจจุบัน (หลังเผา/หลังเคลื่อนย้าย)
 * คลิกแถวเพื่อขยายดูประวัติโหวตทุกรายการของกระเป๋านั้น (มีลิงก์ kubscan ทุกรายการ)
 */

import { useMemo, useState, Fragment } from "react";
import type { TokenInfo } from "../lib/token";
import type { ElectionModel } from "../lib/election";
import { buildWalletStats, type WalletVoteStat } from "../lib/analytics";
import { SortTh, nextSort, cmpBig, type SortState } from "./SortTh";
import {
  fmtDateTimeShort,
  fmtNum,
  shortAddr,
  weiToGkubString,
} from "../lib/format";
import { explorerAddrUrl, explorerTxUrl } from "../config/chain";
import { useNowTick } from "../hooks/useCountdown";

/** ชื่อหมวดย่อ สำหรับ chip ต่อกระเป๋า */
const SHORT_CAT: Record<number, string> = {
  19: "Builder",
  18: "Community",
  17: "KOL",
  16: "Holder",
  15: "Node",
};

interface Props {
  model: ElectionModel;
  balances: Map<string, bigint>;
  missing: string[];
  balancesUpdatedAtMs: number | null;
  balancesLoading: boolean;
  progressDone: number;
  progressTotal: number;
  tokenInfo: TokenInfo | null;
  onRefreshBalances: () => void;
}

export function WalletTable({
  model,
  balances,
  missing,
  balancesUpdatedAtMs,
  balancesLoading,
  progressDone,
  progressTotal,
  tokenInfo,
  onRefreshBalances,
}: Props) {
  const now = useNowTick();
  const [expanded, setExpanded] = useState<string | null>(null);
  const stats = useMemo(() => buildWalletStats(model), [model]);

  // ---- การเรียงลำดับ (คลิกหัวตาราง) — default: คะแนนที่เผา มาก→น้อย
  type SortKey = "address" | "balance" | "burned" | "txs" | "proposals";
  const [sort, setSortRaw] = useState<SortState>({ key: "burned", dir: "desc" });
  const setSort = (s: SortState): void => setSortRaw(s);

  const sorted = useMemo(() => {
    if (sort.key === "burned" && sort.dir === "desc") return stats; // default (buildWalletStats เรียงไว้แล้ว)
    const flip = sort.dir === "asc" ? 1 : -1;
    const arr = [...stats];
    const tie = (a: WalletVoteStat, b: WalletVoteStat): number =>
      b.txCount - a.txCount || a.address.localeCompare(b.address);
    switch (sort.key as SortKey) {
      case "burned":
        arr.sort((a, b) => flip * (cmpBig(a.totalWei, b.totalWei) || tie(a, b)));
        break;
      case "balance": {
        const balOf = (w: WalletVoteStat): bigint | null => {
          const b = balances.get(w.address);
          return b == null ? null : b;
        };
        arr.sort((a, b) => {
          const ba = balOf(a);
          const bb = balOf(b);
          // กระเป๋าที่ยอด "--" (อ่านไม่สำเร็จ) ท้ายสุดเสมอ ทุกทิศทางเรียง
          const nul = (ba == null ? 1 : 0) - (bb == null ? 1 : 0);
          if (nul !== 0) return nul;
          if (ba == null || bb == null) return 0;
          return flip * (cmpBig(ba, bb) || tie(a, b));
        });
        break;
      }
      case "txs":
        arr.sort((a, b) => flip * (a.txCount - b.txCount || tie(a, b)));
        break;
      case "proposals":
        arr.sort((a, b) => flip * (a.proposalIds.length - b.proposalIds.length || tie(a, b)));
        break;
      case "address":
        arr.sort((a, b) => flip * a.address.localeCompare(b.address));
        break;
    }
    return arr;
  }, [stats, sort, balances]);

  const knownCount = stats.filter((w) => balances.has(w.address)).length;
  const agoSec =
    balancesUpdatedAtMs != null
      ? Math.max(0, (now - balancesUpdatedAtMs) / 1000)
      : null;
  const onSort = (k: string): void =>
    setSort(nextSort(sort, k, k === "address" ? "asc" : "desc"));

  // token supply: totalSupply() คือยอด "หลัง" การเผา — ยอดก่อนโหวต = supply + เผาเพื่อโหวต
  const burnedWei = model.totalVoteWei;
  const preVoteWei =
    tokenInfo?.totalSupplyWei != null ? tokenInfo.totalSupplyWei + burnedWei : null;
  const burnedPctOfPre =
    preVoteWei != null && preVoteWei > 0n
      ? Number((burnedWei * 10000n) / preVoteWei) / 100
      : null;

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <div className="cat">Analytics</div>
          <h3>
            ผู้โหวตทุกกระเป๋า — คะแนนที่เผา + ยอด gKUB ในกระเป๋า
            <span className="muted" style={{ fontSize: 12 }}>
              {" "}
              · {stats.length} กระเป๋า (จาก ProposalVoted logs)
            </span>
          </h3>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span className="chip">
            ยอด gKUB: <b>{knownCount}/{stats.length}</b> อ่านสด
          </span>
          <button className="btn" onClick={onRefreshBalances} disabled={balancesLoading}>
            {balancesLoading
              ? progressTotal > 0
                ? `กำลังอ่านเชน… ${progressDone}/${progressTotal}`
                : "กำลังอ่านเชน…"
              : "⟲ ยอด gKUB ทุกกระเป๋า"}
          </button>
        </div>
      </div>

      {/* strip ยอด token ระดับกิจกรรม */}
      <div className="tok-strip">
        <span className="wal-chip">
          <b>{tokenInfo?.symbol ?? "gKUB"}</b> · {tokenInfo?.name ?? "—"}
        </span>
        {tokenInfo?.totalSupplyWei != null && (
          <span className="wal-chip">
            Total supply (ปัจจุบัน):{" "}
            <b>{fmtNum(weiToGkubString(tokenInfo.totalSupplyWei))}</b>
          </span>
        )}
        {preVoteWei != null && (
          <span className="wal-chip accent">
            เผาเพื่อโหวต: <b>{fmtNum(weiToGkubString(burnedWei))}</b> (≈
            {fmtNum(burnedPctOfPre ?? 0, 4)}% ของยอดก่อนโหวต)
          </span>
        )}
        {tokenInfo != null && tokenInfo.decimals !== 18 && (
          <span className="pill warn">⚠ decimals={tokenInfo.decimals} (แอปคำนวณแบบ 18)</span>
        )}
        <span className="muted" style={{ fontSize: 11.5, marginLeft: "auto" }}>
          {agoSec != null
            ? `อ่านยอด ณ ${fmtNum(agoSec, 0)} วินาทีก่อน · รีเฟรชอัตโนมัติทุก ~5 นาที (อ่านทยอยทีละใบ กัน RPC rate limit)`
            : "กำลังอ่านยอดจากเชน…"}
        </span>
      </div>

      {missing.length > 0 && (
        <p className="mini-note muted">
          ⚠ อ่าน balanceOf ได้ {knownCount}/{stats.length} กระเป๋า — กระเป๋าที่ "—" แสดงว่า RPC
          ตอบไม่สำเร็จตอนนั้น (ไม่ได้แปลว่ายอดเป็น 0) กดปุ่มยอด gKUB เพื่อลองใหม่
        </p>
      )}

      {stats.length === 0 ? (
        <p className="muted" style={{ marginTop: 12 }}>
          ยังไม่มีข้อมูลโหวต — ระบบจะอ่านใหม่อัตโนมัติทุก ~15 วินาที
        </p>
      ) : (
        <div className="txf-scroll" style={{ marginTop: 12 }}>
          <table className="votes">
            <thead>
              <tr>
                <th className="rank-col">#</th>
                <SortTh label="กระเป๋า" k="address" sort={sort} onSort={onSort} />
                <SortTh label="gKUB ในกระเป๋า (ปัจจุบัน)" k="balance" sort={sort} onSort={onSort} right />
                <SortTh label="คะแนนที่เผา (gKUB)" k="burned" sort={sort} onSort={onSort} right />
                <SortTh label="Tx" k="txs" sort={sort} onSort={onSort} right />
                <SortTh label="หมวดที่ลง" k="proposals" sort={sort} onSort={onSort} />
              </tr>
            </thead>
            <tbody>
              {sorted.map((w, i) => {
                const bal = balances.get(w.address);
                const open = expanded === w.address;
                return (
                  <Fragment key={w.address}>
                    <tr
                      className="wal-row-click"
                      onClick={() => setExpanded(open ? null : w.address)}
                    >
                      <td className="rank-col wal-rank">{i + 1}</td>
                      <td>
                        <a
                          className="mono"
                          href={explorerAddrUrl(w.address)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title={w.address}
                        >
                          {shortAddr(w.address)}
                        </a>
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                          color: bal === 0n ? "var(--muted)" : undefined,
                        }}
                      >
                        {bal != null ? fmtNum(weiToGkubString(bal)) : "—"}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                          fontWeight: 500,
                          color: "var(--accent)",
                        }}
                      >
                        {fmtNum(weiToGkubString(w.totalWei))}
                      </td>
                      <td style={{ textAlign: "right" }}>{w.txCount}</td>
                      <td>
                        <span className="wal-cats">
                          {w.proposalIds.map((pid) => (
                            <span className="wal-catchip" key={pid}>
                              #{pid} {SHORT_CAT[pid] ?? ""}
                            </span>
                          ))}
                        </span>
                      </td>
                    </tr>
                    {open && (
                      <tr className="wal-expand">
                        <td colSpan={6}>
                          <div className="wal-detail">
                            <div className="wal-detail-sum">
                              <span>
                                คะแนนสะสม{" "}
                                <b>{fmtNum(weiToGkubString(w.totalWei))} gKUB</b>
                              </span>
                              <span>· โหวต {w.txCount} ธุรกรรม</span>
                              <span>
                                · ครั้งแรก{" "}
                                {w.firstTs ? fmtDateTimeShort(w.firstTs) : "—"}
                              </span>
                              <span>
                                · ล่าสุด {w.lastTs ? fmtDateTimeShort(w.lastTs) : "—"}
                              </span>
                            </div>
                            <table className="votes wal-detail-table">
                              <thead>
                                <tr>
                                  <th>เวลา (ไทย)</th>
                                  <th>ข้อ</th>
                                  <th>เลือก</th>
                                  <th style={{ textAlign: "right" }}>คะแนน</th>
                                  <th>Tx</th>
                                </tr>
                              </thead>
                              <tbody>
                                {w.details.map((d) => (
                                  <tr key={`${d.txHash}:${d.choice}:${d.proposalId}`}>
                                    <td>
                                      {d.ts ? fmtDateTimeShort(d.ts) : `ก้อน ${d.block}`}
                                    </td>
                                    <td>
                                      #{d.proposalId} · {d.category}
                                    </td>
                                    <td>
                                      <b style={{ fontWeight: 500 }}>{d.choiceName}</b>
                                    </td>
                                    <td
                                      style={{
                                        textAlign: "right",
                                        fontVariantNumeric: "tabular-nums",
                                      }}
                                    >
                                      {fmtNum(weiToGkubString(d.amountWei))}
                                    </td>
                                    <td>
                                      <a
                                        className="mono"
                                        href={explorerTxUrl(d.txHash)}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        ↗
                                      </a>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mini-note muted" style={{ marginTop: 10 }}>
        ยอด "ในกระเป๋า" คือ balanceOf ของ gKUB ณ ปัจจุบัน (สดจากเชน) — คะแนนโหวตถูก burn ไปแล้ว
        จึงไม่รวมอยู่ในยอดนี้ · ข้อจำกัด: เช็คเฉพาะกระเป๋าที่ลงโหวตเทิร์นนี้ ไม่ใช่ทุกกระเป๋าทั้งเชน
      </p>
    </section>
  );
}

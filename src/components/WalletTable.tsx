/**
 * Analytics ผู้โหวต — รวมข้อมูล 2 แหล่งเป็นตารางเดียว:
 *   1) ProposalVoted logs → คะแนนที่เผา (exact wei), จำนวน tx, หมวดที่ลง, ประวัติรายการ
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
import { useLang } from "../i18n";
import { t } from "../i18n/dict";

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
  const { lang } = useLang(); // re-render เมื่อภาษาเปลี่ยน
  void lang;
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
            {t("wt.title")}
            <span className="muted" style={{ fontSize: 12 }}>
              {" "}
              · {t("wt.walletCount", { n: stats.length })}
            </span>
          </h3>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span className="chip">
            {t("wt.chipKnown", { a: knownCount, b: stats.length })}
          </span>
          <button className="btn" onClick={onRefreshBalances} disabled={balancesLoading}>
            {balancesLoading
              ? progressTotal > 0
                ? t("wt.btnReading", { d: progressDone, n: progressTotal })
                : t("wt.btnReadingPlain")
              : t("wt.btnRead")}
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
            {t("wt.supply")}{" "}
            <b>{fmtNum(weiToGkubString(tokenInfo.totalSupplyWei))}</b>
          </span>
        )}
        {preVoteWei != null && (
          <span className="wal-chip accent burn-summary">
            <span className="burn-label">{t("wt.burnLabel")}</span>
            <b>{fmtNum(weiToGkubString(burnedWei))}</b>
            <small>{t("wt.burnPct", { p: fmtNum(burnedPctOfPre ?? 0, 4) })}</small>
          </span>
        )}
        {tokenInfo != null && tokenInfo.decimals !== 18 && (
          <span className="pill warn">{t("wt.decimalsWarn", { d: tokenInfo.decimals })}</span>
        )}
        <span className="muted" style={{ fontSize: 11.5, marginLeft: "auto" }}>
          {agoSec != null
            ? t("wt.readAgo", { n: fmtNum(agoSec, 0) })
            : t("wt.reading")}
        </span>
      </div>

      {missing.length > 0 && (
        <p className="mini-note muted">
          {t("wt.missingNote", { a: knownCount, b: stats.length })}
        </p>
      )}

      {stats.length === 0 ? (
        <p className="muted" style={{ marginTop: 12 }}>
          {t("wt.empty")}
        </p>
      ) : (
        <div className="txf-scroll" style={{ marginTop: 12 }}>
          <table className="votes">
            <thead>
              <tr>
                <th className="rank-col">#</th>
                <SortTh label={t("wt.col.wallet")} k="address" sort={sort} onSort={onSort} />
                <SortTh label={t("wt.col.balance")} k="balance" sort={sort} onSort={onSort} right />
                <SortTh label={t("wt.col.burned")} k="burned" sort={sort} onSort={onSort} right />
                <SortTh label="Tx" k="txs" sort={sort} onSort={onSort} right />
                <SortTh label={t("wt.col.cats")} k="proposals" sort={sort} onSort={onSort} />
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
                              <small>#{pid}</small> {SHORT_CAT[pid] ?? ""}
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
                                {t("wt.exp.total")}{" "}
                                <b>{fmtNum(weiToGkubString(w.totalWei))} gKUB</b>
                              </span>
                              <span>{t("wt.exp.tx", { n: w.txCount })}</span>
                              <span>
                                {t("wt.exp.first", {
                                  d: w.firstTs ? fmtDateTimeShort(w.firstTs) : "—",
                                })}
                              </span>
                              <span>
                                {t("wt.exp.last", {
                                  d: w.lastTs ? fmtDateTimeShort(w.lastTs) : "—",
                                })}
                              </span>
                            </div>
                            <table className="votes wal-detail-table">
                              <thead>
                                <tr>
                                  <th>{t("wt.col.time")}</th>
                                  <th>{t("wt.col.item")}</th>
                                  <th>{t("wt.col.choice")}</th>
                                  <th style={{ textAlign: "right" }}>{t("wt.col.score")}</th>
                                  <th>Tx</th>
                                </tr>
                              </thead>
                              <tbody>
                                {w.details.map((d) => (
                                  <tr key={`${d.txHash}:${d.choice}:${d.proposalId}`}>
                                    <td>
                                      {d.ts
                                        ? fmtDateTimeShort(d.ts)
                                        : t("chip.block", { n: d.block })}
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
        {t("wt.footNote")}
      </p>
    </section>
  );
}

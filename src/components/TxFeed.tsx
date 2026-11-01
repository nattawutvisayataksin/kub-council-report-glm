import { useMemo, useState } from "react";
import { explorerAddrUrl, explorerTxUrl } from "../config/chain";
import { APP_CONFIG } from "../config/election";
import type { RefundRow, VoteRow } from "../lib/election";
import { SortTh, nextSort, cmpBig, type SortState } from "./SortTh";
import { fmtDateTimeShort, fmtNum, shortAddr, weiToGkubString } from "../lib/format";
import { useLang } from "../i18n";
import { t } from "../i18n/dict";

const catById: Record<number, string> = {
  19: "Builder & Developer",
  18: "Community Contributor",
  17: "KOL",
  16: "KUB Coin Holder",
  15: "Node Validator",
};

type SortKey = "time" | "proposal" | "choice" | "voter" | "amount";

const SORT_LABEL_KEY: Record<SortKey, string> = {
  time: "k.time",
  proposal: "k.item",
  choice: "k.choice",
  voter: "k.voter",
  amount: "k.amount",
};

interface Props {
  /** รายการโหวตทั้งหมด (App ส่งมาทั้งชุดเสมอ — การตัด 25 ล่าสุดเกิดข้างใน) */
  votes: VoteRow[];
  refunds: RefundRow[];
  nameOf: (proposalId: number, choice: number) => string;
  total: number;
}

export function TxFeed({ votes, refunds, nameOf, total }: Props) {
  const { lang } = useLang(); // re-render เมื่อภาษาเปลี่ยน (คำเรียง/หัวตาราง)
  void lang;
  const [showAll, setShowAll] = useState(false);
  const [sort, setSort] = useState<SortState>({ key: "time", dir: "desc" });

  const visible = useMemo(() => {
    const flip = sort.dir === "asc" ? 1 : -1;
    const key = sort.key as SortKey;
    const sorted = [...votes].sort((a, b) => {
      switch (key) {
        case "time": {
          // เวลาอ้าง block units (เชื่อถือได้แม้ ts หาย) + logIndex เทียบละเอียด
          return (
            flip * (a.block - b.block || a.logIndex - b.logIndex)
          );
        }
        case "proposal":
          return flip * (a.proposalId - b.proposalId || a.block - b.block);
        case "choice":
          return flip * (a.choice - b.choice || a.proposalId - b.proposalId);
        case "voter":
          return flip * a.voter.localeCompare(b.voter);
        case "amount": {
          return flip * (cmpBig(a.amountWei, b.amountWei) || a.block - b.block);
        }
      }
    });
    return showAll ? sorted : sorted.slice(0, APP_CONFIG.TX_FEED_LIMIT);
  }, [votes, showAll, sort]);

  const onSort = (k: string): void => {
    setSort(nextSort(sort, k, k === "voter" ? "asc" : "desc"));
    setShowAll(true); // ต้องการเรียง = ดูข้ามทุกกระเป๋า
  };

  const collapse = (): void => {
    setShowAll(false);
    setSort({ key: "time", dir: "desc" });
  };

  const sortHint = showAll
    ? t("tf.sortHintAll", {
        k: t(SORT_LABEL_KEY[sort.key as SortKey]),
        dir: t(sort.dir === "desc" ? "tf.dir.desc" : "tf.dir.asc"),
      })
    : t("tf.sortHintLatest", { n: visible.length, total });

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <div className="cat">{t("tf.cat")}</div>
          <h3>
            {t("tf.title")}{" "}
            <span className="muted" style={{ fontSize: 12 }}>· {sortHint}</span>
          </h3>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span className="chip">{t("tf.all", { n: total })}</span>
          {showAll ? (
            <button className="btn" onClick={collapse}>
              {t("tf.showLatest", { n: APP_CONFIG.TX_FEED_LIMIT })}
            </button>
          ) : (
            <button className="btn" onClick={() => setShowAll(true)}>
              {t("tf.showAll", { n: total })}
            </button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="muted" style={{ marginTop: 12 }}>
          {t("tf.empty")}
        </p>
      ) : (
        <div
          className="txf-scroll"
          style={{ marginTop: 12, maxHeight: showAll ? 640 : 430 }}
        >
          <table className="votes">
            <thead>
              <tr>
                <SortTh label={t("tf.col.time")} k="time" sort={sort} onSort={onSort} />
                <SortTh label={t("tf.col.item")} k="proposal" sort={sort} onSort={onSort} />
                <SortTh label={t("tf.col.choice")} k="choice" sort={sort} onSort={onSort} />
                <SortTh label={t("tf.col.voter")} k="voter" sort={sort} onSort={onSort} />
                <SortTh label={t("tf.col.amount")} k="amount" sort={sort} onSort={onSort} right />
                <th>Tx</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((v) => (
                <tr key={v.key}>
                  <td>
                    {v.blockTs
                      ? fmtDateTimeShort(v.blockTs)
                      : t("chip.block", { n: v.block })}
                  </td>
                  <td>
                    #{v.proposalId} · {catById[v.proposalId] ?? "—"}
                  </td>
                  <td>
                    <b style={{ fontWeight: 500 }}>{nameOf(v.proposalId, v.choice)}</b>
                  </td>
                  <td>
                    <a className="mono" href={explorerAddrUrl(v.voter)} target="_blank" rel="noreferrer">
                      {shortAddr(v.voter)}
                    </a>
                  </td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {fmtNum(weiToGkubString(v.amountWei))}
                  </td>
                  <td>
                    <a className="mono" href={explorerTxUrl(v.txHash)} target="_blank" rel="noreferrer">
                      ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {refunds.length > 0 && (
        <div style={{ marginTop: 12 }} className="muted">
          <div style={{ fontSize: 12.5, marginBottom: 6 }}>
            {t("tf.refundHead", { n: refunds.length })} <b>{t("tf.refundNote")}</b>
          </div>
          <div className="txf-scroll">
            <table className="votes">
              <tbody>
                {refunds.slice(0, 10).map((r) => (
                  <tr key={r.key}>
                    <td>
                      {r.blockTs
                        ? fmtDateTimeShort(r.blockTs)
                        : t("chip.block", { n: r.block })}
                    </td>
                    <td>#{r.proposalId}</td>
                    <td className="mono">{shortAddr(r.voter)}</td>
                    <td style={{ textAlign: "right" }}>
                      {fmtNum(weiToGkubString(r.amountWei))} gKUB
                    </td>
                    <td>
                      <a className="mono" href={explorerTxUrl(r.txHash)} target="_blank" rel="noreferrer">
                        ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

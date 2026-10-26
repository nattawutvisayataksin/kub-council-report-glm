import { useMemo, useState } from "react";
import { explorerAddrUrl, explorerTxUrl } from "../config/chain";
import { APP_CONFIG } from "../config/election";
import type { RefundRow, VoteRow } from "../lib/election";
import { SortTh, nextSort, cmpBig, type SortState } from "./SortTh";
import { fmtDateTimeShort, fmtNum, shortAddr, weiToGkubString } from "../lib/format";

const catById: Record<number, string> = {
  19: "Builder & Developer",
  18: "Community Contributor",
  17: "KOL",
  16: "KUB Coin Holder",
  15: "Node Validator",
};

type SortKey = "time" | "proposal" | "choice" | "voter" | "amount";

const SORT_LABEL: Record<SortKey, string> = {
  time: "เวลา",
  proposal: "ข้อ",
  choice: "ผู้สมัครที่เลือก",
  voter: "ผู้โหวต",
  amount: "คะแนน",
};

interface Props {
  /** รายการโหวตทั้งหมด (App ส่งมาทั้งชุดเสมอ — การตัด 25 ล่าสุดเกิดข้างใน) */
  votes: VoteRow[];
  refunds: RefundRow[];
  nameOf: (proposalId: number, choice: number) => string;
  total: number;
}

export function TxFeed({ votes, refunds, nameOf, total }: Props) {
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
    ? `เรียงตาม ${SORT_LABEL[sort.key as SortKey]} (${sort.dir === "desc" ? "มาก→น้อย" : "น้อย→มาก"}) · คลิกหัวตารางเพื่อเปลี่ยน`
    : `ล่าสุด ${visible.length} จาก ${total} รายการ · คลิกหัวตารางเพื่อเรียง`;

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <div className="cat">ธุรกรรม</div>
          <h3>
            รายการโหวตจากบล็อกเชน <span className="muted" style={{ fontSize: 12 }}>· {sortHint}</span>
          </h3>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span className="chip">ทั้งหมด <b>{total}</b> รายการ</span>
          {showAll ? (
            <button className="btn" onClick={collapse}>
              ⤡ แสดงเฉพาะ {APP_CONFIG.TX_FEED_LIMIT} ล่าสุด
            </button>
          ) : (
            <button className="btn" onClick={() => setShowAll(true)}>
              ⤢ แสดงธุรกรรมทั้งหมด ({total})
            </button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="muted" style={{ marginTop: 12 }}>
          ยังไม่พบรายการโหวตใหม่ — ระบบจะเช็คอัตโนมัติจากเชนทุก ~15 วินาที
        </p>
      ) : (
        <div
          className="txf-scroll"
          style={{ marginTop: 12, maxHeight: showAll ? 640 : 430 }}
        >
          <table className="votes">
            <thead>
              <tr>
                <SortTh label="เวลา (ไทย)" k="time" sort={sort} onSort={onSort} />
                <SortTh label="ข้อเลือกตั้ง" k="proposal" sort={sort} onSort={onSort} />
                <SortTh label="ผู้สมัครที่เลือก" k="choice" sort={sort} onSort={onSort} />
                <SortTh label="ผู้โหวต" k="voter" sort={sort} onSort={onSort} />
                <SortTh label="คะแนน (gKUB)" k="amount" sort={sort} onSort={onSort} right />
                <th>Tx</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((v) => (
                <tr key={v.key}>
                  <td>{v.blockTs ? fmtDateTimeShort(v.blockTs) : `ก้อน ${v.block}`}</td>
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
            การคืน gKUB (VoteTokenWithdrawn) {refunds.length} รายการ — หมายเหตุ: ซอร์สโค้ดยืนยันว่าการ withdraw
            <b> ไม่ลด</b> choiceVoted/totalVoted บนเชน (คะแนนที่ "เผา" ไปแล้วยังนับตามเดิม)
          </div>
          <div className="txf-scroll">
            <table className="votes">
              <tbody>
                {refunds.slice(0, 10).map((r) => (
                  <tr key={r.key}>
                    <td>{r.blockTs ? fmtDateTimeShort(r.blockTs) : `ก้อน ${r.block}`}</td>
                    <td>#{r.proposalId}</td>
                    <td className="mono">{shortAddr(r.voter)}</td>
                    <td style={{ textAlign: "right" }}>{fmtNum(weiToGkubString(r.amountWei))} gKUB</td>
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

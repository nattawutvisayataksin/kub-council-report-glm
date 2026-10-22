import { explorerAddrUrl, explorerTxUrl } from "../config/chain";
import type { RefundRow, VoteRow } from "../lib/election";
import { fmtDateTimeShort, fmtNum, shortAddr, weiToGkubString } from "../lib/format";

const catById: Record<number, string> = {
  19: "Builder & Developer",
  18: "Community Contributor",
  17: "KOL",
  16: "KUB Coin Holder",
  15: "Node Validator",
};

interface Props {
  votes: VoteRow[];
  refunds: RefundRow[];
  nameOf: (proposalId: number, choice: number) => string;
  total: number;
}

export function TxFeed({ votes, refunds, nameOf, total }: Props) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <div className="cat">ธุรกรรม</div>
          <h3>
            รายการโหวตจากบล็อกเชน <span className="muted" style={{ fontSize: 12 }}>· ล่าสุด {votes.length} จาก {total} รายการ</span>
          </h3>
        </div>
      </div>

      {votes.length === 0 ? (
        <p className="muted" style={{ marginTop: 12 }}>
          ยังไม่พบรายการโหวตใหม่ — ระบบจะเช็คอัตโนมัติจากเชนทุก ~15 วินาที
        </p>
      ) : (
        <div className="txf-scroll" style={{ marginTop: 12 }}>
          <table className="votes">
            <thead>
              <tr>
                <th>เวลา (ไทย)</th>
                <th>ข้อเลือกตั้ง</th>
                <th>ผู้สมัครที่เลือก</th>
                <th>ผู้โหวต</th>
                <th style={{ textAlign: "right" }}>คะแนน (gKUB)</th>
                <th>Tx</th>
              </tr>
            </thead>
            <tbody>
                {votes.map((v) => (
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

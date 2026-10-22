import { useNowTick } from "../hooks/useCountdown";
import type { ProposalModel } from "../lib/election";
import { fmtDateTimeShort, fmtNum, weiToGkubString } from "../lib/format";

function statusOf(p: ProposalModel, nowMs: number): { label: string; cls: string } {
  const notEnded = nowMs < p.endTs * 1000;
  if (notEnded) return { label: "เปิดโหวตอยู่", cls: "ok" };
  if (p.completed) return { label: "เสร็จสมบูรณ์ ✓", cls: "ok" };
  if (p.closed) return { label: "ปิด (ไม่ถึง quorum)", cls: "bad" };
  return { label: "รอปิดผล", cls: "warn" };
}

export function ProposalCard({ p }: { p: ProposalModel }) {
  const now = useNowTick();
  const st = statusOf(p, now);

  // เรียงตามคะแนน (มาก → น้อย) โดย rank = ลำดับในการเรียงนี้
  const opts = [...p.options].sort((a, b) => {
    if (b.votesWei !== a.votesWei) return b.votesWei > a.votesWei ? 1 : -1;
    return a.idx - b.idx;
  });
  const maxWei = opts.length > 0 ? (opts[0]?.votesWei ?? 0n) : 0n;

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <span className="cat">{p.category}</span>
          <h3>
            {p.title} <span className="muted" style={{ fontSize: 12 }}>· ข้อ #{p.id}</span>
          </h3>
        </div>
        <span className={`pill ${st.cls}`}>{st.label}</span>
      </div>

      <ul className="ops">
        {opts.map((o, i) => {
          const widthPct = maxWei > 0n ? Number((o.votesWei * 1000n) / maxWei) / 10 : 0;
          return (
            <li
              className={`op${o.isLeader ? " leader" : ""}${o.isAbstain ? " abstain" : ""}`}
              key={o.idx}
            >
              <div className="bar-head">
                <span className="rank">#{i + 1}</span>
                <span className="op-name">{o.name}</span>
                {o.isAbstain && <em className="tag">abstain</em>}
                <span className="op-votes">
                  {fmtNum(weiToGkubString(o.votesWei))}
                  <small>gKUB</small>
                </span>
              </div>
              <div className="bar">
                <span style={{ width: `${widthPct}%` }} />
              </div>
              <div className="bar-sub">
                <span>
                  {fmtNum(o.pct, 1)}% ของคะแนนข้อนี้
                  {o.isLeader && <b style={{ color: "var(--accent)", fontWeight: 500 }}> · ผู้นำ</b>}
                </span>
                <span>{o.voters > 0 ? `ผู้โหวต ${o.voters} คน (ไม่ซ้ำ)` : "—"}</span>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="card-foot">
        <span>
          รวม <b>{fmtNum(weiToGkubString(p.totalVotedWei))} gKUB</b>
        </span>
        <span>
          Quorum <b>{fmtNum(weiToGkubString(p.minQuorumWei))} gKUB</b>{" "}
          <b style={{ color: p.quorumMet ? "var(--accent)" : "var(--warn)" }}>
            {p.quorumMet ? "ผ่าน ✓" : "ยังไม่ผ่าน"}
          </b>
        </span>
        <span>
          ผู้โหวตไม่ซ้ำ <b>{p.userVotedLength > 0 ? p.userVotedLength : "—"}</b>
        </span>
        <span>
          ธุรกรรมโหวต <b>{p.voteRowCount}</b>
        </span>
      </div>

      <div className="times">
        <span>เปิด {fmtDateTimeShort(p.startTs)}</span>
        <span>ปิด {fmtDateTimeShort(p.endTs)}</span>
        {p.tallyMatchesView === true && <span className="pill ok">ตรงกับ state บนเชน ✓</span>}
        {p.tallyMatchesApi === true && <span className="pill ok">ตรงกับ /api/votes ✓</span>}
        {p.tallyMatchesApi === false && <span className="pill warn">คลาดเคลื่อนกับ /api/votes</span>}
      </div>
    </section>
  );
}

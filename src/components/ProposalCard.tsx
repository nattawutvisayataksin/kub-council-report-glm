import { useNowTick } from "../hooks/useCountdown";
import type { ProposalModel } from "../lib/election";
import { fmtNum, weiToGkubString } from "../lib/format";
import { useLang } from "../i18n";
import { t } from "../i18n/dict";

function statusOf(p: ProposalModel, nowMs: number): { label: string; cls: string } {
  const notEnded = nowMs < p.endTs * 1000;
  if (notEnded) return { label: t("pc.open"), cls: "ok" };
  if (p.completed) return { label: t("pc.completed"), cls: "ok" };
  if (p.closed) return { label: t("pc.closed"), cls: "bad" };
  return { label: t("pc.wait"), cls: "warn" };
}

export function ProposalCard({ p }: { p: ProposalModel }) {
  const { lang } = useLang(); // re-render เมื่อภาษาเปลี่ยน (statusOf ใช้ t)
  void lang;
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
            {p.title}{" "}
            <span className="muted" style={{ fontSize: 12 }}>
              · {t("pc.item", { id: p.id })}
            </span>
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
                  {t("pc.pctOfItem", { p: fmtNum(o.pct, 1) })}
                  {o.isLeader && (
                    <b style={{ color: "var(--accent)", fontWeight: 500 }}>{t("pc.leader")}</b>
                  )}
                </span>
                <span>{o.voters > 0 ? t("pc.voters", { n: o.voters }) : "—"}</span>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="card-foot">
        <span>
          {t("pc.total")} <b>{fmtNum(weiToGkubString(p.totalVotedWei))} gKUB</b>
        </span>
        <span>
          Quorum <b>{fmtNum(weiToGkubString(p.minQuorumWei))} gKUB</b>{" "}
          <b style={{ color: p.quorumMet ? "var(--accent)" : "var(--warn)" }}>
            {p.quorumMet ? t("pc.quorumPassed") : t("pc.quorumNotYet")}
          </b>
        </span>
        <span>
          {t("pc.nvoters")} <b>{p.userVotedLength > 0 ? p.userVotedLength : "—"}</b>
        </span>
        <span>
          {t("pc.txcount")} <b>{p.voteRowCount}</b>
        </span>
      </div>

      <div className="times">
        {p.tallyMatchesView === true && <span className="pill ok">{t("pc.matchView")}</span>}
        {p.tallyMatchesApi === true && <span className="pill ok">{t("pc.matchApi")}</span>}
        {p.tallyMatchesApi === false && <span className="pill warn">{t("pc.mismatchApi")}</span>}
      </div>
    </section>
  );
}

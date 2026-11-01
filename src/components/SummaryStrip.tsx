import type { ElectionModel } from "../lib/election";
import { weiToGkubString, fmtNum } from "../lib/format";
import { useLang } from "../i18n";
import { t } from "../i18n/dict";

interface Props {
  model: ElectionModel;
  onExportSummary: () => void;
  onExportDetail: () => void;
  onExportWallets?: () => void;
}

export function SummaryStrip({ model, onExportSummary, onExportDetail, onExportWallets }: Props) {
  useLang(); // re-render เมื่อภาษาเปลี่ยน
  const proposals = model.proposals.length;
  const quorumMet = model.proposals.filter((p) => p.quorumMet).length;

  const stats: Array<{ v: string; k: string }> = [
    { v: String(proposals), k: "sum.proposals" },
    { v: fmtNum(model.uniqueVoters), k: "sum.voters" },
    { v: fmtNum(model.totalVoteCount), k: "sum.tx" },
    { v: `${fmtNum(weiToGkubString(model.totalVoteWei))} gKUB`, k: "sum.burn" },
    { v: `${quorumMet}/${proposals}`, k: "sum.quorum" },
  ];

  return (
    <section className="summary">
      {stats.map((s) => (
        <div className="stat" key={s.k}>
          <div className="v">{s.v}</div>
          <div className="l">{t(s.k)}</div>
        </div>
      ))}
      <div className="exports">
        <button className="btn primary" onClick={onExportSummary}>
          {t("exp.summary")}
        </button>
        <button className="btn" onClick={onExportDetail}>
          {t("exp.detail")}
        </button>
        {onExportWallets && (
          <button className="btn" onClick={onExportWallets}>
            {t("exp.wallets")}
          </button>
        )}
      </div>
    </section>
  );
}

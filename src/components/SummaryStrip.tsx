import type { ElectionModel } from "../lib/election";
import { weiToGkubString, fmtNum } from "../lib/format";

interface Props {
  model: ElectionModel;
  onExportSummary: () => void;
  onExportDetail: () => void;
  onExportWallets?: () => void;
}

export function SummaryStrip({ model, onExportSummary, onExportDetail, onExportWallets }: Props) {
  const proposals = model.proposals.length;
  const quorumMet = model.proposals.filter((p) => p.quorumMet).length;

  const stats: Array<{ v: string; l: string }> = [
    { v: String(proposals), l: "ข้อเลือกตั้ง (1 ที่นั่ง/ข้อ)" },
    { v: fmtNum(model.uniqueVoters), l: "ผู้โหวตไม่ซ้ำทั้งเทิร์น" },
    { v: fmtNum(model.totalVoteCount), l: "ธุรกรรมโหวตบนเชน" },
    { v: `${fmtNum(weiToGkubString(model.totalVoteWei))} gKUB`, l: "gKUB ถูกเผารวม (bonfire)" },
    { v: `${quorumMet}/${proposals}`, l: "ผ่าน quorum (20 gKUB)" },
  ];

  return (
    <section className="summary">
      {stats.map((s) => (
        <div className="stat" key={s.l}>
          <div className="v">{s.v}</div>
          <div className="l">{s.l}</div>
        </div>
      ))}
      <div className="exports">
        <button className="btn primary" onClick={onExportSummary}>
          ⬇ Export: ผลสรุป (CSV)
        </button>
        <button className="btn" onClick={onExportDetail}>
          ⬇ Export: แหล่งธุรกรรมโหวต (CSV)
        </button>
        {onExportWallets && (
          <button className="btn" onClick={onExportWallets}>
            ⬇ Export: ต่อผู้โหวต (CSV)
          </button>
        )}
      </div>
    </section>
  );
}

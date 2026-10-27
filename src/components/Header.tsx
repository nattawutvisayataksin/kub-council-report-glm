import { useNowTick } from "../hooks/useCountdown";
import { fmtAgoSeconds, shortAddr } from "../lib/format";
import { explorerAddrUrl } from "../config/chain";
import { GKUB_TOKEN } from "../config/election";
import type { ElectionModel } from "../lib/election";
import ballotBox from "../assets/pixel/ballot-box.png";

interface Props {
  model: ElectionModel;
  refreshing: boolean;
  refreshNow: () => void;
}

export function Header({ model, refreshing, refreshNow }: Props) {
  const now = useNowTick();
  const agoSec = model.fetchedAtMs ? Math.max(0, (now - model.fetchedAtMs) / 1000) : 0;

  return (
    <header className="header">
      <div className="brand">
        <span className="logo">🗳️</span>
        <img className="pixel-brand-sprite" src={ballotBox} alt="" width={56} height={56} />
        <div>
          <div className="title">KUB Community Council Election — Round 2</div>
          <div className="subtitle">
            รายงานผลโหวตจริงที่อ่านจากบล็อกเชน KUB Chain Mainnet (Chain ID 96) · read-only · ไม่ใช่เว็บทางการ
          </div>
        </div>
      </div>

      <div className="chips">
        {model.mode === "live" ? (
          <span className="chip">
            <span className="dot" /> On-chain live
          </span>
        ) : model.mode === "api-fallback" ? (
          <span className="chip warn">
            <span className="dot" /> API snapshot fallback
          </span>
        ) : (
          <span className="chip off">
            <span className="dot" /> ไม่มีการเชื่อมต่อ
          </span>
        )}

        <span className="chip">
          Blockchain #96 · {model.latestBlock > 0 ? `ก้อน ${model.latestBlock.toLocaleString("en-US")}` : "—"}
        </span>

        {model.voteToken && (
          <a className="chip" href={explorerAddrUrl(GKUB_TOKEN)} target="_blank" rel="noreferrer">
            gKUB {model.voteTokenVerified ? "✓ verified" : "⚠"} {shortAddr(model.voteToken)}
          </a>
        )}

        {model.crossCheckOk === true && (
          <span className="chip">
            <span className="dot" /> Cross-check /api/votes ✓ ตรงทุกตัว
          </span>
        )}
        {model.crossCheckOk === false && (
          <span className="chip warn">
            <span className="dot" /> Cross-check คลาดเคลื่อน — ตรวจ console
          </span>
        )}

        <span className="chip">อัปเดตล่าสุด: {fmtAgoSeconds(agoSec)}</span>

        <button className="btn" onClick={refreshNow} disabled={refreshing}>
          <span className={refreshing ? "icon" : undefined}>⟳</span>
          {refreshing ? "กำลังอัปเดต…" : "อัปเดตตอนนี้"}
        </button>
      </div>
    </header>
  );
}

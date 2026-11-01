import { useState } from "react";
import { useNowTick } from "../hooks/useCountdown";
import { fmtAgoSeconds, shortAddr } from "../lib/format";
import { explorerAddrUrl } from "../config/chain";
import { GKUB_TOKEN } from "../config/election";
import type { ElectionModel } from "../lib/election";
import { useLang } from "../i18n";
import { t } from "../i18n/dict";
import { LangToggle } from "./LangToggle";

interface Props {
  model: ElectionModel;
  refreshing: boolean;
  refreshNow: () => void;
}

export function Header({ model, refreshing, refreshNow }: Props) {
  const now = useNowTick();
  const { lang } = useLang(); // re-render เมื่อภาษาเปลี่ยน
  void lang;
  const [shareDone, setShareDone] = useState(false);
  const agoSec = model.fetchedAtMs ? Math.max(0, (now - model.fetchedAtMs) / 1000) : 0;

  const shareNow = async (): Promise<void> => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const data = { title: document.title, text: t("share.text"), url };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return; // ผู้ใช้แชร์ผ่าน OS dialog — ไม่ต้อง toast
      }
      throw new Error("no navigator.share");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      // fallback: คัดลอกลิงก์ (เดสก์ท็อป Chrome บางเวอร์ชัน / บราวเซอร์ไม่รองรับ Web Share)
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // คัดลอกไม่ได้ (ไม่ใช่ user gesture/https) — ปล่อยเงียบ ๆ
      }
      setShareDone(true);
      setTimeout(() => setShareDone(false), 2_000);
    }
  };

  return (
    <header className="header">
      <div className="brand">
        <span className="logo">🗳️</span>
        <div>
          <div className="title election-title">
            <strong>KUB COMMUNITY COUNCIL</strong>
          </div>
          <div className="subtitle">{t("header.subtitle")}</div>
        </div>
      </div>

      <div className="chips">
        {model.mode === "live" ? (
          <span className="chip">
            <span className="dot" /> {t("chip.live")}
          </span>
        ) : (
          <span className="chip off">
            <span className="dot" /> {t("chip.offline")}
          </span>
        )}

        <span className="chip">
          Blockchain #96 ·{" "}
          {model.latestBlock > 0 ? t("chip.block", { n: model.latestBlock.toLocaleString("en-US") }) : "—"}
        </span>

        {model.voteToken && (
          <a className="chip" href={explorerAddrUrl(GKUB_TOKEN)} target="_blank" rel="noreferrer">
            gKUB {model.voteTokenVerified ? "✓ verified" : "⚠"} {shortAddr(model.voteToken)}
          </a>
        )}

        <span className="chip">{t("chip.updated", { t: fmtAgoSeconds(agoSec) })}</span>

        <button className="btn" onClick={refreshNow} disabled={refreshing}>
          <span className={refreshing ? "icon" : undefined}>⟳</span>
          {refreshing ? t("btn.refreshing") : t("btn.refresh")}
        </button>

        <button className="btn" onClick={() => void shareNow()} title={t("btn.share")}>
          {shareDone ? t("share.done") : `🔗 ${t("btn.share")}`}
        </button>

        <LangToggle />
      </div>
    </header>
  );
}

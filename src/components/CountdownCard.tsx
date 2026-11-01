import { ROUND_END_TS, ROUND_START_TS } from "../config/election";
import { useNowTick } from "../hooks/useCountdown";
import { countdownParts, fmtDateTime } from "../lib/format";
import { useLang } from "../i18n";
import { t } from "../i18n/dict";

export function CountdownCard() {
  const { lang } = useLang(); // re-render เมื่อภาษาเปลี่ยน
  void lang;
  const now = useNowTick();
  const parts = countdownParts(ROUND_END_TS, now);

  const spanMs = (ROUND_END_TS - ROUND_START_TS) * 1000;
  const passed = now - ROUND_START_TS * 1000;
  const prog = Math.min(100, Math.max(0, (passed / spanMs) * 100));

  const boxes: Array<[string, string]> = [
    [String(parts.days), t("cd.u.days")],
    [String(parts.hours).padStart(2, "0"), t("cd.u.hours")],
    [String(parts.mins).padStart(2, "0"), t("cd.u.mins")],
    [String(parts.secs).padStart(2, "0"), t("cd.u.secs")],
  ];

  return (
    <section className="card">
      <div className="cd-head">
        <div>
          <div className="cat">{t("cd.cat")}</div>
          <h3 style={{ margin: "8px 0 2px", fontSize: 16, fontWeight: 500 }}>
            {parts.finished ? t("cd.closedTitle") : t("cd.openTitle")}
          </h3>
        </div>
        <div className="muted" style={{ fontSize: 12.5 }}>
          {t("cd.closesAt", { d: fmtDateTime(ROUND_END_TS) })}
        </div>
      </div>

      {parts.finished ? (
        <div className="cd-boxes">
          <span className="pill ok">{t("cd.finalNote")}</span>
        </div>
      ) : (
        <div className="cd-boxes">
          {boxes.map(([v, l]) => (
            <div className="cd-box" key={l}>
              <div className="v">{v}</div>
              <div className="l">{l}</div>
            </div>
          ))}
        </div>
      )}

      <div className="progress">
        <span style={{ width: `${prog}%` }} />
      </div>
      <div className="bar-sub">
        <span>{t("cd.opened", { d: fmtDateTime(ROUND_START_TS) })}</span>
        <span>{t("cd.pctSpan", { p: prog.toFixed(1) })}</span>
      </div>
    </section>
  );
}

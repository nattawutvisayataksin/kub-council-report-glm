import { ROUND_END_TS, ROUND_START_TS } from "../config/election";
import { useNowTick } from "../hooks/useCountdown";
import { countdownParts, fmtDateTime } from "../lib/format";

export function CountdownCard() {
  const now = useNowTick();
  const parts = countdownParts(ROUND_END_TS, now);

  const spanMs = (ROUND_END_TS - ROUND_START_TS) * 1000;
  const passed = now - ROUND_START_TS * 1000;
  const prog = Math.min(100, Math.max(0, (passed / spanMs) * 100));

  const boxes: Array<[string, string]> = [
    [String(parts.days), "วัน"],
    [String(parts.hours).padStart(2, "0"), "ชั่วโมง"],
    [String(parts.mins).padStart(2, "0"), "นาที"],
    [String(parts.secs).padStart(2, "0"), "วินาที"],
  ];

  return (
    <section className="card">
      <div className="cd-head">
        <div>
          <div className="cat">นาฬิกา</div>
          <h3 style={{ margin: "8px 0 2px", fontSize: 16, fontWeight: 500 }}>
            {parts.finished ? "🔒 ปิดรับโหวตแล้ว" : "⏳ นับถอยหลังปิดรับโหวต"}
          </h3>
        </div>
        <div className="muted" style={{ fontSize: 12.5 }}>
          ปิดรับโหวต: {fmtDateTime(ROUND_END_TS)} (เวลาไทย)
        </div>
      </div>

      {parts.finished ? (
        <div className="cd-boxes">
          <span className="pill ok">ผลโหวตสุดท้ายอยู่ด้านล่าง (ค่าจากบล็อกเชน)</span>
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
        <span>เปิดโหวต {fmtDateTime(ROUND_START_TS)}</span>
        <span>{prog.toFixed(1)}% ของช่วงเวลาโหวต</span>
      </div>
    </section>
  );
}

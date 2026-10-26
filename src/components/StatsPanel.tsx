/**
 * สถิติ/กราฟรวม — ทุกค่า derive จาก ElectionModel (on-chain เท่านั้น)
 * 1) Donut การกระจายคะแนนตามหมวด (SVG วาดเอง)
 * 2) Timeline เผา gKUB สะสมตามเวลา (SVG วาดเอง)
 * ไม่มี chart library เพิ่ม — bundle เบาต่อเนื่องกับแนวทางเดิม
 */

import { useMemo } from "react";
import type { ElectionModel } from "../lib/election";
import {
  buildBurnTimeline,
  buildProposalTotals,
  type ProposalTotal,
  type TimelinePoint,
} from "../lib/analytics";
import { fmtDateTimeShort, fmtNum, weiToGkubString } from "../lib/format";

const DONUT_COLORS = ["#2fe97a", "#35f08a", "#7ce3b0", "#57c9ff", "#b6ff7c", "#ffd166"];

// ---------------------------------------------------------------- donut

function DistributionDonut({
  totals,
  sumWei,
}: {
  totals: ProposalTotal[];
  sumWei: bigint;
}) {
  const R = 56;
  const C = 2 * Math.PI * R;
  const segs: { color: string; len: number; start: number }[] = [];
  let acc = 0;
  totals.forEach((t, i) => {
    if (sumWei <= 0n || t.totalWei <= 0n) return;
    const frac = Number((t.totalWei * 1_000_000n) / sumWei) / 1_000_000;
    const len = Math.max(frac * C, 0.5); // ให้ slice เล็กจิ๋วมี "ขีด" ให้เห็น
    segs.push({ color: DONUT_COLORS[i % DONUT_COLORS.length], len, start: acc });
    acc += frac * C;
  });

  return (
    <div className="donut-wrap">
      <div className="donut">
        <svg viewBox="0 0 170 170" role="img" aria-label="การกระจายคะแนนตามหมวด">
          <circle
            cx="85"
            cy="85"
            r={R}
            fill="none"
            stroke="#10241a"
            strokeWidth="16"
          />
          {segs.map((s, i) => (
            <circle
              key={i}
              cx="85"
              cy="85"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth="16"
              strokeLinecap="butt"
              strokeDasharray={`${s.len} ${C - s.len}`}
              strokeDashoffset={-s.start}
              transform="rotate(-90 85 85)"
            />
          ))}
        </svg>
        <div className="donut-center">
          <div className="v">{sumWei > 0n ? fmtNum(weiToGkubString(sumWei)) : "—"}</div>
          <div className="l">gKUB เผารวมทุก 5 หมวด</div>
        </div>
      </div>
      <ul className="legend">
        {totals.map((t, i) => (
          <li key={t.id}>
            <span
              className="dot"
              style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
            />
            <span className="nm">
              #{t.id} {t.category}
            </span>
            <span className="vv">{fmtNum(weiToGkubString(t.totalWei))}</span>
            <span className="pp">{fmtNum(t.pctOfAll, 2)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------- timeline

function BurnTimeline({ points }: { points: TimelinePoint[] }) {
  const W = 560;
  const H = 200;
  const padL = 52;
  const padR = 14;
  const padT = 18;
  const padB = 30;

  if (points.length === 0)
    return (
      <p className="mini-note muted">
        ยังไม่มีธุรกรรมโหวตที่มี timestamp — ระบบจะวาดกราฟเมื่อมีข้อมูลจากเชน
      </p>
    );

  const t0 = points[0]!.ts;
  const tN = points[points.length - 1]!.ts;
  const span = tN > t0 ? tN - t0 : 1;
  const maxWei = points[points.length - 1]!.cumWei;
  const xOf = (ts: number): number =>
    padL + ((ts - t0) / span) * (W - padL - padR);
  const yOf = (cum: bigint): number =>
    H - padB - Number((cum * 10_000n) / maxWei) / 10_000 * (H - padT - padB);

  const ptsSvg = points
    .map((p) => `${xOf(p.ts).toFixed(1)},${yOf(p.cumWei).toFixed(1)}`)
    .join(" ");
  const lastX = xOf(tN);
  const bottom = H - padB;

  return (
    <div className="tl">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="เผา gKUB สะสมตามเวลา">
        <defs>
          <linearGradient id="burnFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(47, 233, 122, 0.32)" />
            <stop offset="100%" stopColor="rgba(47, 233, 122, 0.02)" />
          </linearGradient>
        </defs>

        {/* เส้นตาราง + สเกล y */}
        <g stroke="rgba(143, 179, 163, 0.25)" strokeDasharray="4 5">
          <line x1={padL} y1={yOf(maxWei)} x2={W - padR} y2={yOf(maxWei)} />
          <line
            x1={padL}
            y1={yOf(maxWei / 2n)}
            x2={W - padR}
            y2={yOf(maxWei / 2n)}
          />
        </g>
        <text x={padL - 6} y={yOf(maxWei) + 3.5} textAnchor="end" fontSize="10" fill="#8fb3a3">
          {fmtNum(weiToGkubString(maxWei))}
        </text>
        <text
          x={padL - 6}
          y={yOf(maxWei / 2n) + 3.5}
          textAnchor="end"
          fontSize="10"
          fill="#8fb3a3"
        >
          {fmtNum(weiToGkubString(maxWei / 2n))}
        </text>
        <text x={padL - 6} y={bottom + 3.5} textAnchor="end" fontSize="10" fill="#8fb3a3">
          0
        </text>

        {/* พื้นที่ + เส้น + จุดธุรกรรม */}
        <polygon
          points={`${padL},${bottom} ${ptsSvg} ${lastX},${bottom}`}
          fill="url(#burnFill)"
          stroke="none"
        />
        <polyline
          points={ptsSvg}
          fill="none"
          stroke="#2fe97a"
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p) => (
          <circle key={`${p.ts}:${p.txIndex}`} cx={xOf(p.ts)} cy={yOf(p.cumWei)} r="2.6" fill="#b6ff7c">
            <title>{`${fmtDateTimeShort(p.ts)} · ${fmtNum(weiToGkubString(p.cumWei))} gKUB สะสม`}</title>
          </circle>
        ))}

        {/* แกนล่าง: เวลาแรกและเวลาล่าสุด */}
        <text x={padL} y={bottom + 16} fontSize="10" fill="#8fb3a3">
          {fmtDateTimeShort(t0)}
        </text>
        <text x={lastX} y={bottom + 16} textAnchor="end" fontSize="10" fill="#8fb3a3">
          {fmtDateTimeShort(tN)}
        </text>
        <line x1={padL} y1={bottom} x2={W - padR} y2={bottom} stroke="rgba(143, 179, 163, 0.35)" />
      </svg>
      <div className="bar-sub">
        <span>แต่ละจุด = ธุรกรรมโหวต 1 รายการ (hover เพื่อดูเวลา)</span>
        <span>สะสม {points.length} tx</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- panel

export function StatsPanel({ model }: { model: ElectionModel }) {
  const { totals, sumWei } = useMemo(() => buildProposalTotals(model), [model]);
  const points = useMemo(() => buildBurnTimeline(model.votes), [model]);

  return (
    <section className="stats-grid">
      <div className="card">
        <div className="card-head">
          <div>
            <div className="cat">สถิติ · กราฟ</div>
            <h3>การกระจายคะแนนตามหมวด</h3>
          </div>
          {model.mode === "api-fallback" && <span className="pill warn">ค่าจาก API snapshot</span>}
        </div>
        <DistributionDonut totals={totals} sumWei={sumWei} />
        <p className="mini-note muted">
          คะแนนรวมต่อ "ข้อ" = ทุกตัวเลือกในข้อนั้นรวม abstain · หน่วย gKUB ถูกเผาตรงช่องนั้น
        </p>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <div className="cat">สถิติ · กราฟ</div>
            <h3>เผา gKUB สะสมตามเวลา</h3>
          </div>
          {model.mode === "api-fallback" && <span className="pill warn">ต้องมี on-chain</span>}
        </div>
        <BurnTimeline points={points} />
      </div>
    </section>
  );
}

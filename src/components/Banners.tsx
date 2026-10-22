import { fmtAgoSeconds } from "../lib/format";

export function ApiFallbackBanner({
  apiUpdatedAt,
  apiFetchedAtMs,
}: {
  apiUpdatedAt: string | null;
  apiFetchedAtMs: number | null;
}) {
  return (
    <div className="banner warn">
      <b>⚠ โหมด API snapshot:</b> ไม่สามารถติดต่อ RPC ของ KUB Chain ได้ตอนนี้ ระบบจึงแสดงผลจาก API ของหน้า
      kubcouncil (<a href="https://kubcouncil.vercel.app/api/votes" target="_blank" rel="noreferrer">/api/votes</a>)
      ซึ่งมาจากแหล่งเดียวกัน — {apiUpdatedAt ? `ข้อมูล API ปรับปรุงที่ ${apiUpdatedAt}` : "ไม่มี timestamp จาก API"}
      {apiFetchedAtMs ? ` (ดึงเมื่อ ${fmtAgoSeconds((Date.now() - apiFetchedAtMs) / 1000)})` : ""} ระบบจะพยายามกลับไปอ่าน on-chain ทุก ~15 วินาที
    </div>
  );
}

export function UnavailableBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="banner bad">
      <b>⛔ ข้อมูลไม่พร้อมแสดง:</b> ทั้ง RPC ของ KUB Chain และ API cross-check ไม่ตอบสนอง
      ได้ข้อมูลไม่ถูกต้องพอจะแสดงจริง แสดงข้อมูลเปล่า ไม่มี mock data — ลองกดปุ่ม
      <button className="btn" style={{ marginLeft: 8 }} onClick={onRetry}>
        ลองอีกครั้ง
      </button>
    </div>
  );
}

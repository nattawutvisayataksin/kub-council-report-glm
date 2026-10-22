import { useEffect, useState } from "react";
import { countdownParts, type CountdownParts } from "../lib/format";

/** นาฬิกานับถอยหลัง ลื่นไหลทุกวินาที (แสดงผลบนหน้าเว็บเท่านั้น — ข้อมูลโหนดข้อมูลจริงอยู่ใน lib) */
export function useCountdown(targetTsSeconds: number): CountdownParts {
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);
  return countdownParts(targetTsSeconds, nowMs);
}

/** เอาไว้แสดง "จาก .... วินาทีที่แล้ว" บังคับ re-render 1 ครั้ง/วิ */
export function useNowTick(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);
  return now;
}

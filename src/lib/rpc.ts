/**
 * RPC-safe helpers — กัน rate limit ของ rpc.kubchain.io
 *
 * ข้อค้นพบจาก HANDOFF §6: RPC error "Request exceeds defined limit." เมื่อยิง
 * request หลายตัวพร้อมกัน (burst) โดยเฉพาะ eth_call/eth_getBlock — เครื่องมือถือ
 * เครือข่ายช้ายิ่งทำให้คำขอเปิดค้างเจอโควตา "พร้อมกัน" ง่ายกว่า PC
 *
 * กติกาที่ใช้กับทุกจุดดึงเชนในแอปนี้:
 *  → ยิงตามลำดับ (paced) + retry/backoff ถ้าเจอ error ลักษณะ throttle ให้รอนานขึ้น
 */

import { sleep } from "./token";

/** รู้จำ error แบบ rate-limit/throttle เพื่อ backoff นานขึ้นเป็นพิเศษ */
export function isThrottleError(e: unknown): boolean {
  const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
  return (
    msg.includes("exceeds defined limit") ||
    msg.includes("rate limit") ||
    msg.includes("ratelimit") ||
    msg.includes("too many") ||
    msg.includes("429") ||
    msg.includes("-32005")
  );
}

/**
 * เรียกงานเดียวพร้อม retry + exponential backoff
 * เจอ throttle → เว้นนานขึ้น 3 เท่าต่อ attempt
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts?: { retries?: number; baseMs?: number },
): Promise<T> {
  const retries = opts?.retries ?? 2;
  const baseMs = opts?.baseMs ?? 700;
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (attempt >= retries) throw e;
      const throttle = isThrottleError(e);
      const delay = baseMs * 2 ** attempt * (throttle ? 3 : 1);
      await sleep(delay);
    }
  }
}

import { useCallback, useEffect, useRef, useState } from "react";
import { getRpcUrl } from "../config/chain";
import { SCAN_START_BLOCK } from "../config/election";
import {
  fetchElectionModel,
  type ElectionModel,
  type RefundRow,
  type VoteRow,
} from "../lib/election";

/** โหลดครั้งแรกล้ม → ลองใหม่หลายรอบก่อนแสดง error (มือถือ/เครือข่ายช้าเจอ throttle ง่ายกว่า PC) */
const BOOT_RETRY_MAX = 3;
/** ถ้า mode = unavailable ให้ลองเองทุก 45 วิ โดยไม่ต้องกดปุ่ม */
const UNAVAILABLE_RETRY_MS = 45_000;

export interface ElectionState {
  loading: boolean;
  refreshing: boolean;
  model: ElectionModel | null;
  lastUpdatedMs: number | null;
}

const EMPTY_MODEL: ElectionModel = {
  mode: "unavailable",
  fetchedAtMs: 0,
  latestBlock: 0,
  voteToken: null,
  voteTokenVerified: false,
  proposals: [],
  votes: [],
  refunds: [],
  uniqueVoters: 0,
  totalVoteCount: 0,
  totalVoteWei: 0n,
  warnings: [],
};

/** โหลดข้อมูลสดเมื่อเปิดหน้า และต่อจากบล็อกล่าสุดที่ตรวจสอบผ่านในหน่วยความจำ */
export function useElection(): ElectionState & { refreshNow: () => void } {
  const rpcUrl = getRpcUrl();

  const [state, setStateRaw] = useState<ElectionState>({
    loading: true,
    refreshing: false,
    model: null,
    lastUpdatedMs: null,
  });
  // mirror ของ state สำหรับ interval ที่สร้างครั้งเดียว (อ่านค่าล่าสุดได้เสมอ)
  const stateRef = useRef<ElectionState | null>(null);
  const setState: typeof setStateRaw = (updater) =>
    setStateRaw((s) => {
      const next = typeof updater === "function" ? updater(s) : updater;
      stateRef.current = next;
      return next;
    });

  const ref = useRef({
    scannedTo: SCAN_START_BLOCK - 1,
    votes: [] as VoteRow[],
    refunds: [] as RefundRow[],
    blockTimestamps: new Map<number, number>(),
    inflight: false,
    bootFails: 0,
  });

  const run = useCallback(async () => {
    if (ref.current.inflight) return;
    // แท็บอยู่หลังเบื้องหลัง (ปกติบนมือถือ) → ข้ามรอบ poll เพื่อประหยัด quota RPC
    // จะกลับมาทำงานทันทีเมื่อกลับมาที่แท็บ (ดู effect ด้านล่าง)
    if (typeof document !== "undefined" && document.hidden && ref.current.votes.length > 0) {
      return;
    }
    ref.current.inflight = true;
    setState((s) => ({ ...s, refreshing: true }));
    try {
      const { model, scannedTo } = await fetchElectionModel({
        rpcUrl,
        fromBlock: ref.current.scannedTo + 1,
        previous: {
          votes: ref.current.votes.slice(),
          refunds: ref.current.refunds.slice(),
        },
        blockTimestamps: ref.current.blockTimestamps,
      });
      if (model.mode === "live") {
        ref.current.scannedTo = Math.max(ref.current.scannedTo, scannedTo);
        ref.current.votes = model.votes;
        ref.current.refunds = model.refunds;
      }
      ref.current.bootFails = 0;
      setState({
        loading: false,
        refreshing: false,
        model,
        lastUpdatedMs: model.fetchedAtMs,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const firstBoot = ref.current.votes.length === 0;
      if (firstBoot) {
        // โหลดครั้งแรกล้ม (มัก rate limit) → ลองใหม่พร้อม backoff ก่อนยอมแสดง error
        ref.current.bootFails += 1;
        const tries = ref.current.bootFails;
        if (tries <= BOOT_RETRY_MAX) {
          setState((s) => ({ ...s, loading: true, refreshing: false }));
          const wait = 2_500 * 2 ** (tries - 1); // 2.5s → 5s → 10s
          setTimeout(() => void run(), wait);
          return;
        }
      }
      setState((s) => ({
        loading: false,
        refreshing: false,
        model: {
          ...EMPTY_MODEL,
          warnings: [`${firstBoot ? `RPC ล้มเหลว ${ref.current.bootFails} ครั้ง: ` : ""}${msg} — มักเกิดจาก rate limit ของ RPC (Request exceeds defined limit) ระบบจะลองใหม่เอง`],
        },
        lastUpdatedMs: s.lastUpdatedMs,
      }));
    } finally {
      ref.current.inflight = false;
    }
  }, [rpcUrl]);

  useEffect(() => {
    try {
      window.localStorage.removeItem("kub-council-data-v1");
    } catch (error) {
      console.warn("Could not remove the legacy election snapshot", error);
    }
    // อ่านเชนเฉพาะตอนเปิดหน้าครั้งแรก — ไม่มี auto refresh
    // จากนั้นผู้ใช้กดปุ่ม "อัปเดตตอนนี้" เอง (refreshNow) เมื่อไหร่ก็ได้
    // ข้อยกเว้น: เมื่อยังไม่มีข้อมูลแม้แต่ค่าเดียว (mode unavailable) ให้ลองเอง
    // ทุก 45 วิ เพื่อไม่ให้รายงานว่างไปเปล่าเมื่อเจอ RPC rate limit ตอนเปิดครั้งแรก
    stateRef.current = state;
    void run();
    const iv = setInterval(() => {
      const m = stateRef.current?.model;
      if (!m || m.mode === "unavailable") void run();
    }, UNAVAILABLE_RETRY_MS);
    return () => clearInterval(iv);
  }, []);

  return { ...state, refreshNow: run };
}

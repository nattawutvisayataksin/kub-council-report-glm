import { useCallback, useEffect, useRef, useState } from "react";
import { getApiFallbackUrl, getRpcUrl } from "../config/chain";
import { APP_CONFIG, SCAN_START_BLOCK } from "../config/election";
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
  crossCheckOk: null,
  apiUpdatedAt: null,
  apiFetchedAtMs: null,
  proposals: [],
  votes: [],
  refunds: [],
  uniqueVoters: 0,
  totalVoteCount: 0,
  totalVoteWei: 0n,
  warnings: [],
};

/** polling ทุก ~15 วินาที: ครั้งแรกสแกนตั้งแต่ SCAN_START_BLOCK, รอบถัดไปแบบ incremental */
export function useElection(): ElectionState & { refreshNow: () => void } {
  const rpcUrl = getRpcUrl();
  const apiFallbackUrl = getApiFallbackUrl();

  const [state, setState] = useState<ElectionState>({
    loading: true,
    refreshing: false,
    model: null,
    lastUpdatedMs: null,
  });

  const ref = useRef({
    scannedTo: SCAN_START_BLOCK,
    votes: [] as VoteRow[],
    refunds: [] as RefundRow[],
    blockTsCache: new Map<number, number>(),
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
        apiFallbackUrl,
        fromBlock: ref.current.scannedTo + 1,
        previous: {
          votes: ref.current.votes.slice(),
          refunds: ref.current.refunds.slice(),
        },
        blockTsCache: ref.current.blockTsCache,
      });
      ref.current.scannedTo = Math.max(ref.current.scannedTo, scannedTo);
      ref.current.votes = model.votes;
      ref.current.refunds = model.refunds;
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
        model: s.model ?? {
          ...EMPTY_MODEL,
          warnings: [`${firstBoot ? `RPC ล้มเหลว ${ref.current.bootFails} ครั้ง: ` : ""}${msg} — มักเกิดจาก rate limit ของ RPC (Request exceeds defined limit) ระบบจะลองใหม่เอง`],
        },
        lastUpdatedMs: s.lastUpdatedMs,
      }));
    } finally {
      ref.current.inflight = false;
    }
  }, [rpcUrl, apiFallbackUrl]);

  useEffect(() => {
    void run();
    const iv = setInterval(() => void run(), APP_CONFIG.REFRESH_MS);
    // กลับมาที่แท็บ → ดึงล่าสุดทันที (เพราะรอบที่แท็บซ่อนถูกข้าม)
    const onVisible = (): void => {
      if (!document.hidden) void run();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [run]);

  // mode unavailable (RPC+API ไม่ตอบ) → ลองใหม่เองทุก 45 วิ ไม่ต้องรอผู้ใช้กด
  const unavailable = state.model?.mode === "unavailable";
  useEffect(() => {
    if (!unavailable) return;
    const iv = setInterval(() => void run(), UNAVAILABLE_RETRY_MS);
    return () => clearInterval(iv);
  }, [unavailable, run]);

  return { ...state, refreshNow: run };
}

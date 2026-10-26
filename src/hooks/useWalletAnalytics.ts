/**
 * Hook: อ่านยอด gKUB ในกระเป๋าของผู้โหวตทุกใบ + token info จากเชน
 * - อ่านแบบ "sequential ทยอยทีละใบ เว้น ~400ms" เพราะ rpc.kubchain.io มี rate limit
 *   (ทดสอบจริง: sequential = 22/22 ครบ, burst 6 ชุด = เหลือ 6/22)
 * -ปรับ progress ระหว่างอ่าน — ตารางเติมยอดเรียงไปทีละแถว
 * - ปุ่ม manual `refreshBalances()` รีอ่านทุกกระเป๋าสดจากเชน
 * - auto refresh ทุก ~5 นาที
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getRpcUrl } from "../config/chain";
import { GKUB_TOKEN } from "../config/election";
import { makeKubClient } from "../lib/client";
import type { ElectionModel } from "../lib/election";
import { fetchBalanceOne, fetchTokenInfo, sleep, type TokenInfo } from "../lib/token";

export interface WalletAnalyticsState {
  /** lowercase address → wei (เฉพาะที่อ่านสำเร็จ) */
  balances: Map<string, bigint>;
  /** กระเป๋าที่ยังไม่ทราบยอด */
  missing: string[];
  updatedAtMs: number | null;
  loading: boolean;
  /** progress ระหว่างการอ่านแบบทยอย (done/total) */
  progressDone: number;
  progressTotal: number;
  tokenInfo: TokenInfo | null;
  refreshBalances: () => void;
}

const AUTO_REFRESH_MS = 300_000; // ~5 นาที
const BAL_DELAY_MS = 420; // เว้นระยะระหว่างแต่ละ balanceOf (กัน rate limit)
const BAL_RETRIES = 2;

export function useWalletAnalytics(model: ElectionModel | null): WalletAnalyticsState {
  const rpcUrl = getRpcUrl();

  const [balances, setBalances] = useState<Map<string, bigint>>(new Map());
  const [missing, setMissing] = useState<string[]>([]);
  const [updatedAtMs, setUpdatedAtMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [progressDone, setProgressDone] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);

  // refs เพื่อให้ fn ไม่ต้อง depend กับ model ใหม่ทุกรอบ poll (กัน re-run จริง)
  const modelRef = useRef<ElectionModel | null>(model);
  modelRef.current = model;
  const balRef = useRef<Map<string, bigint>>(new Map());
  const infoRef = useRef<TokenInfo | null>(null);
  const inflightRef = useRef(false);

  /** ชุดกระเป๋าผู้โหวต ณ นี้ (เปลี่ยนเมื่อมีกระเป๋าใหม่เท่านั้น) */
  const votersKey = useMemo(() => {
    if (!model) return "";
    return [...new Set(model.votes.map((v) => v.voter.toLowerCase()))]
      .sort()
      .join(",");
  }, [model]);

  const run = useCallback(
    async (mode: "unknown" | "all") => {
      if (inflightRef.current) return;
      const m = modelRef.current;
      if (!m) return;
      const wallets = [...new Set(m.votes.map((v) => v.voter.toLowerCase()))].sort();
      if (wallets.length === 0) return;

      inflightRef.current = true;
      setLoading(true);
      try {
        const client = makeKubClient(rpcUrl);

        // token info อ่านครั้งเดียวต้า session (ถ้าล้มเหลวจะลองใหม่รอบถัดไป)
        if (infoRef.current == null) {
          try {
            const info = await fetchTokenInfo(client, GKUB_TOKEN);
            if (info.totalSupplyWei != null) {
              infoRef.current = info;
              setTokenInfo(info);
            }
          } catch {
            // ปล่อยไป — UI แสดง "—" และลองใหม่รอบถัดไป
          }
        }

        const wanted =
          mode === "all" ? wallets : wallets.filter((w) => !balRef.current.has(w));
        setProgressTotal(wanted.length);
        setProgressDone(0);

        for (let i = 0; i < wanted.length; i++) {
          const bal = await fetchBalanceOne(client, GKUB_TOKEN, wanted[i]!, {
            retries: BAL_RETRIES,
          });
          if (bal != null) {
            const next = new Map(balRef.current);
            next.set(wanted[i]!, bal);
            balRef.current = next;
            setBalances(next);
          }
          setProgressDone(i + 1);
          if (i < wanted.length - 1) await sleep(BAL_DELAY_MS);
        }
        setMissing(wallets.filter((w) => !balRef.current.has(w)));
        setUpdatedAtMs(Date.now());
      } finally {
        inflightRef.current = false;
        setLoading(false);
        setProgressTotal(0);
      }
    },
    [rpcUrl],
  );

  // ครั้งแรก + ตอนมีกระเป๋าใหม่เข้ามา
  useEffect(() => {
    if (!votersKey) return;
    void run("unknown");
  }, [votersKey, run]);

  // auto refresh ทุก ~5 นาที
  useEffect(() => {
    const iv = setInterval(() => void run("all"), AUTO_REFRESH_MS);
    return () => clearInterval(iv);
  }, [run]);

  const refreshBalances = useCallback(() => void run("all"), [run]);

  return {
    balances,
    missing,
    updatedAtMs,
    loading,
    progressDone,
    progressTotal,
    tokenInfo,
    refreshBalances,
  };
}

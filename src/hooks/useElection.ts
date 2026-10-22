import { useCallback, useEffect, useRef, useState } from "react";
import { getApiFallbackUrl, getRpcUrl } from "../config/chain";
import { APP_CONFIG, SCAN_START_BLOCK } from "../config/election";
import {
  fetchElectionModel,
  type ElectionModel,
  type RefundRow,
  type VoteRow,
} from "../lib/election";

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
  });

  const run = useCallback(async () => {
    if (ref.current.inflight) return;
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
      setState({
        loading: false,
        refreshing: false,
        model,
        lastUpdatedMs: model.fetchedAtMs,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setState((s) => ({
        loading: false,
        refreshing: false,
        model: s.model ?? { ...EMPTY_MODEL, warnings: [msg] },
        lastUpdatedMs: s.lastUpdatedMs,
      }));
    } finally {
      ref.current.inflight = false;
    }
  }, [rpcUrl, apiFallbackUrl]);

  useEffect(() => {
    void run();
    const iv = setInterval(() => void run(), APP_CONFIG.REFRESH_MS);
    return () => clearInterval(iv);
  }, [run]);

  return { ...state, refreshNow: run };
}

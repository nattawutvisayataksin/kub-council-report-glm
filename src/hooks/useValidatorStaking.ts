import { useCallback, useMemo, useRef, useState } from "react";
import { getRpcUrl } from "../config/chain";
import { makeKubClient } from "../lib/client";
import { fetchValidatorStakeSnapshot, type StakeSnapshot } from "../lib/staking";

export interface ValidatorStakingState {
  snapshot: StakeSnapshot | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/** Explicit/manual fetch: scanning every validator is intentionally never done on the 15-second election poll. */
export function useValidatorStaking(): ValidatorStakingState {
  const rpcUrl = getRpcUrl();
  const [snapshot, setSnapshot] = useState<StakeSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inflightRef = useRef(false);

  const refresh = useCallback(() => {
    if (inflightRef.current) return;
    inflightRef.current = true;
    setLoading(true);
    setError(null);
    void fetchValidatorStakeSnapshot(makeKubClient(rpcUrl))
      .then(setSnapshot)
      .catch(() => setError("อ่านข้อมูล KUB validator stake ไม่สำเร็จ โปรดลองใหม่"))
      .finally(() => {
        inflightRef.current = false;
        setLoading(false);
      });
  }, [rpcUrl]);

  return useMemo(() => ({ snapshot, loading, error, refresh }), [snapshot, loading, error, refresh]);
}

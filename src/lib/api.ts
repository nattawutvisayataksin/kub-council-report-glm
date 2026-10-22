/** Cross-check source: kubcouncil /api/votes (public, keyless) — ใช้เป็นชื่อผู้สมัคร + ตรวจสอบถ่วงน้ำหนักเทียบ on-chain */

import { API_FALLBACK_DEFAULT } from "../config/chain";
import { APP_CONFIG } from "../config/election";

export interface ApiOption {
  idx: number;
  name: string;
  votes: number; // gKUB (จำนวนไม่เป็น wei)
  abstain: boolean;
}

export interface ApiProposal {
  id: number;
  title: string;
  category: string;
  startTs: number;
  endTs: number;
  minQuorum: number; // gKUB
  options: ApiOption[];
}

export interface ApiSnapshot {
  fetchedAtMs: number;
  updatedAt: string | null;
  proposals: ApiProposal[];
}

export async function fetchApiSnapshot(url: string = API_FALLBACK_DEFAULT): Promise<ApiSnapshot> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), APP_CONFIG.API_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = (await res.json()) as Record<string, unknown>;
    const raw = Array.isArray(j.proposals) ? (j.proposals as Record<string, unknown>[]) : [];
    const proposals: ApiProposal[] = raw.map((p, i) => ({
      id: Number(p.id),
      title: String(p.title ?? `Proposal ${p.id ?? i}`),
      category: String(p.category ?? ""),
      startTs: Number(p.startTime),
      endTs: Number(p.endTime),
      minQuorum: Number(p.minQuorum),
      options: (Array.isArray(p.options) ? (p.options as Record<string, unknown>[]) : []).map((o, idx) => {
        const name = String(o.name ?? o.label ?? "");
        return {
          idx,
          name,
          votes: Number(o.votes ?? 0),
          abstain: o.abstain === true || /^abstain$/i.test(name),
        };
      }),
    }));
    return {
      fetchedAtMs: Date.now(),
      updatedAt: typeof j.updatedAt === "string" ? j.updatedAt : null,
      proposals,
    };
  } finally {
    clearTimeout(timer);
  }
}

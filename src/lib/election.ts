/**
 * ============================================================
 *  Election data engine (framework-agnostic, React-free)
 * ============================================================
 * ไปป์ไลน์ข้อมูล (หลัก = on-chain เท่านั้น):
 *
 *   1) eth_getLogs บน GKubProposalV2 (chunk 4000 บล็อก — ปลอดภัยกับ rpc.kubchain.io)
 *      filter แบบ address-only + กรอง topic0 ฝั่ง client (ทดสอบรูปแบบที่ RPC รับจริง)
 *      → decode: ProposalVoted (คะแนน), ProposalCreated (meta), ProposalClosed/
 *        ProposalCompleted (สถานะจบ), VoteTokenWithdrawn (การคืน token — ไม่มีผล
 *        ต่อคะแนน เพราะซอร์สยืนยันว่าไม่มีการลด choiceVoted/totalVoted)
 *   2) readContract getProposalInfoById(id) ต่อ proposal → state quorum/ผู้โหวตล่าสุด
 *   3) readContract voteToken() → ตรวจ gKUB address บนเชน (ต้อง == config)
 *   4) cross-check กับ kubcouncil /api/votes → ชื่อผู้สมัคร + ตัวเลขต้องตรง
 *
 * โปรดทราบ: การโหวต "เผา" gKUB (voteToken.burn ใน source) ทำให้ tally เป็น additive จริง
 * และผลรวม events == state บนเชน == ตัวเลขบน /api/votes (ยืนยันแก่ผู้ใช้)
 */

import { decodeEventLog, encodeEventTopics } from "viem";
import {
  APP_CONFIG,
  CATEGORY_BY_ID,
  DISPLAY_ORDER,
  GKUB_TOKEN,
  PROPOSAL_CONTRACT,
  PROPOSAL_IDS,
  proposalAbi,
  type ProposalId,
} from "../config/election";
import { fetchApiSnapshot, type ApiSnapshot } from "./api";
import { makeKubClient, pickStruct, type KubClient } from "./client";
import { compareWeiTol, gkubStringToWei } from "./format";

// ---------------------------------------------------------------- types

export interface VoteRow {
  key: string; // txHash:logIndex
  txHash: string;
  block: number;
  blockTs: number | null;
  logIndex: number;
  proposalId: number;
  choice: number;
  voter: string;
  amountWei: bigint;
}

export interface RefundRow {
  key: string;
  txHash: string;
  block: number;
  blockTs: number | null;
  proposalId: number;
  voter: string;
  amountWei: bigint;
}

export interface ProposalLive {
  proposalId: number;
  owner: string;
  createTime: number;
  startTs: number;
  endTs: number;
  minQuorumWei: bigint;
  totalVotedWei: bigint;
  userVotedLength: number;
  status: number;
  isOnlyNext: boolean;
  ipfs: string;
  choiceVotedWei: bigint[];
}

export interface OptionModel {
  idx: number;
  name: string;
  isAbstain: boolean;
  votesWei: bigint;
  voters: number; // ผู้โหวตไม่ซ้ำต่อ choice จาก logs (0 = ไม่ทราบ)
  pct: number;
  isLeader: boolean;
}

export interface ProposalModel {
  id: number;
  category: string;
  title: string;
  owner: string;
  startTs: number;
  endTs: number;
  createTime: number;
  numOfChoice: number;
  minQuorumWei: bigint;
  totalVotedWei: bigint;
  userVotedLength: number;
  ipfs: string;
  closed: boolean;
  completed: boolean;
  quorumMet: boolean;
  options: OptionModel[];
  tallyMatchesApi: boolean | null;
  tallyMatchesView: boolean | null;
  voteRowCount: number;
}

export type ModelMode = "live" | "api-fallback" | "unavailable";

export interface ElectionModel {
  mode: ModelMode;
  fetchedAtMs: number;
  latestBlock: number;
  voteToken: string | null;
  voteTokenVerified: boolean;
  crossCheckOk: boolean | null;
  apiUpdatedAt: string | null;
  apiFetchedAtMs: number | null;
  proposals: ProposalModel[];
  votes: VoteRow[]; // block ใหม่ → เก่า
  refunds: RefundRow[];
  uniqueVoters: number;
  totalVoteCount: number;
  totalVoteWei: bigint;
  warnings: string[];
}

// ---------------------------------------------------------------- helpers

const EVENT_NAMES = [
  "ProposalVoted",
  "ProposalCreated",
  "ProposalClosed",
  "ProposalCompleted",
  "VoteTokenWithdrawn",
] as const;
type EventName = (typeof EVENT_NAMES)[number];

function bx(v: unknown): bigint {
  return BigInt(String(v));
}
function nxo(v: unknown): number {
  if (v == null) return 0;
  return Number(BigInt(String(v)));
}
function sx(v: unknown): string {
  return String(v ?? "");
}
function errText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** topic0 จาก ABI จริง (viem เข้ารหัสเอง — ต้องได้ค่าเดียวกับ VERIFIED_TOPIC0 ที่ตรวจจากเชน) */
export function buildTopicIndex(): Map<string, EventName> {
  const m = new Map<string, EventName>();
  for (const name of EVENT_NAMES) {
    const topics = encodeEventTopics({
      abi: proposalAbi,
      eventName: name,
    }) as unknown as string[];
    m.set(topics[0]!.toLowerCase(), name);
  }
  return m;
}

type RawLog = {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  transactionHash: string;
  logIndex: string;
};

type TopicFilter = {
  address: string;
  topics?: string[];
  fromBlock: string;
  toBlock: string;
};

async function getLogsRaw(client: KubClient, filter: TopicFilter): Promise<RawLog[]> {
  // (ผ่านการทดสอบกับ rpc.kubchain.io: eth_getLogs รับ params = [filter] อันเดียว)
  const raw = client as unknown as {
    request: (args: { method: string; params: unknown[] }) => Promise<unknown>;
  };
  const res = (await raw.request({ method: "eth_getLogs", params: [filter] })) as RawLog[];
  return res;
}

/** สแกน log ตามช่วงบล็อก แบ่ง chunk แบบที่ทดสอบผ่านจริงกับ RPC นี้ */
async function fetchLogsChunked(
  client: KubClient,
  from: number,
  to: number,
): Promise<RawLog[]> {
  const all: RawLog[] = [];
  for (let b = from; b <= to; b += APP_CONFIG.VOTE_CHUNK_BLOCKS) {
    const end = Math.min(b + APP_CONFIG.VOTE_CHUNK_BLOCKS - 1, to);
    all.push(
      ...(await getLogsRaw(client, {
        address: PROPOSAL_CONTRACT,
        fromBlock: `0x${b.toString(16)}`,
        toBlock: `0x${end.toString(16)}`,
      })),
    );
  }
  return all;
}

/** normalize struct จาก getProposalInfoById — viem คืนได้ทั้ง array และ object ชื่อ field */
function toProposalLive(raw: unknown): ProposalLive {
  const g = (i: number, key: string): unknown => pickStruct(raw, i, key);
  const choiceArr = (g(5, "choiceVoted") as unknown[] | undefined) ?? [];
  return {
    proposalId: nxo(g(0, "proposalId")),
    owner: sx(g(1, "owner")),
    createTime: nxo(g(2, "createTime")),
    startTs: nxo(g(3, "startTime")),
    endTs: nxo(g(4, "endTime")),
    minQuorumWei: bx(g(8, "minQuorum")),
    totalVotedWei: bx(g(6, "totalVoted")),
    userVotedLength: nxo(g(7, "userVotedLength")),
    status: nxo(g(11, "status")),
    isOnlyNext: Boolean(g(12, "isOnlyNext")),
    ipfs: sx(g(13, "ipfs")),
    choiceVotedWei: choiceArr.map((v) => bx(v)),
  };
}

function firstDefined<T>(...vals: Array<T | undefined | null>): T | undefined {
  for (const v of vals) if (v != null) return v;
  return undefined;
}

// ---------------------------------------------------------------- main

export interface FetchParams {
  rpcUrl: string;
  apiFallbackUrl: string;
  /** hash เริ่มสแกน (inclusive) — รอบแรกใช้ SCAN_START_BLOCK รอบถัดไปเผ้า lastScanned+1 */
  fromBlock: number;
  /** ผลครั้งก่อนเพื่อ dedupe/merge */
  previous?: { votes: VoteRow[]; refunds: RefundRow[] };
  /** cache block→timestamp ระหว่างการทำงาน */
  blockTsCache: Map<number, number>;
  /** force ดึงชื่อ/cross-check จาก API ใหม่ทุกครั้ง */
  apiRefresh?: boolean;
  cachedApi?: ApiSnapshot | null;
}

export interface FetchResult {
  model: ElectionModel;
  scannedTo: number;
}

export async function fetchElectionModel(p: FetchParams): Promise<FetchResult> {
  const warnings: string[] = [];
  const client = makeKubClient(p.rpcUrl);
  const topics0 = buildTopicIndex();
  const idSet = new Set<number>(
    PROPOSAL_IDS.map((v) => Number(v)) as number[],
  );

  // ------------------------------------------------ 1) on-chain status
  let latestBlock = 0;
  let onchainOk = true;
  try {
    latestBlock = Number(await client.getBlockNumber());
  } catch (e) {
    onchainOk = false;
    warnings.push(`RPC fail: ${errText(e)}`);
  }

  // ------------------------------------------------ 2) logs → votes / meta / lifecycle
  const votes: VoteRow[] = p.previous?.votes ?? [];
  const refunds: RefundRow[] = p.previous?.refunds ?? [];
  const createdMeta = new Map<number, Record<string, unknown>>();
  const closedSet = new Set<number>();
  const completedSet = new Set<number>();

  if (onchainOk) {
    try {
      const rawLogs = await fetchLogsChunked(client, p.fromBlock, latestBlock);
      const seen = new Set(votes.map((r) => r.key));
      const seenR = new Set(refunds.map((r) => r.key));
      for (const log of rawLogs) {
        const name = topics0.get((log.topics[0] ?? "").toLowerCase());
        if (!name) continue;
        let dec: { eventName: string; args: Record<string, unknown> };
        try {
          dec = decodeEventLog({
            abi: proposalAbi,
            data: log.data as `0x${string}`,
            topics: log.topics as unknown as [`0x${string}`, ...`0x${string}`[]],
          }) as unknown as { eventName: string; args: Record<string, unknown> };
        } catch {
          continue;
        }
        const a = dec.args ?? {};
        if (name === "ProposalVoted") {
          const pid = nxo(a.proposalId);
          if (!idSet.has(pid)) continue; // เฉพาะเลือกตั้งรอบนี้ (id 15–19)
          const key = `${String(log.transactionHash).toLowerCase()}:${nxo(log.logIndex)}`;
          if (!seen.has(key)) {
            seen.add(key);
            votes.push({
              key,
              txHash: String(log.transactionHash),
              block: nxo(log.blockNumber),
              blockTs: null,
              logIndex: nxo(log.logIndex),
              proposalId: pid,
              choice: nxo(a.choice),
              voter: sx(a.user).toLowerCase(),
              amountWei: bx(a.gKubAmount),
            });
          }
        } else if (name === "ProposalCreated") {
          createdMeta.set(nxo(a.proposalId), a);
        } else if (name === "ProposalClosed") {
          closedSet.add(nxo(a.proposalId));
        } else if (name === "ProposalCompleted") {
          completedSet.add(nxo(a.proposalId));
        } else if (name === "VoteTokenWithdrawn") {
          const pid = nxo(a.proposalId);
          if (!idSet.has(pid)) continue;
          const key = `${String(log.transactionHash).toLowerCase()}:${nxo(log.logIndex)}`;
          if (!seenR.has(key)) {
            seenR.add(key);
            refunds.push({
              key,
              txHash: String(log.transactionHash),
              block: nxo(log.blockNumber),
              blockTs: null,
              proposalId: pid,
              voter: sx(a.user).toLowerCase(),
              amountWei: bx(a.gKubAmount),
            });
          }
        }
      }
    } catch (e) {
      onchainOk = false;
      warnings.push(`getLogs fail: ${errText(e)}`);
    }
  }

  // block timestamps สำหรับ feed
  if (onchainOk) {
    const need = [...new Set([...votes, ...refunds].map((r) => r.block))].filter(
      (b) => !p.blockTsCache.has(b),
    );
    await Promise.all(
      need.map(async (b) => {
        try {
          const blk = await client.getBlock({ blockNumber: BigInt(b) });
          p.blockTsCache.set(b, Number(blk.timestamp));
        } catch {
          p.blockTsCache.set(b, 0);
        }
      }),
    );
  }
  for (const r of votes) r.blockTs = p.blockTsCache.get(r.block) ?? null;
  for (const r of refunds) r.blockTs = p.blockTsCache.get(r.block) ?? null;

  // ------------------------------------------------ 3) live state (view calls)
  const liveInfo = new Map<number, ProposalLive>();
  let voteTokenLive: string | null = null;
  if (onchainOk) {
    try {
      voteTokenLive = (await client.readContract({
        address: PROPOSAL_CONTRACT,
        abi: proposalAbi,
        functionName: "voteToken",
      })) as unknown as string;
    } catch (e) {
      warnings.push(`readContract(voteToken) fail: ${errText(e)}`);
    }
    await Promise.all(
      PROPOSAL_IDS.map(async (id) => {
        try {
          const info = toProposalLive(
            await client.readContract({
              address: PROPOSAL_CONTRACT,
              abi: proposalAbi,
              functionName: "getProposalInfoById",
              args: [BigInt(id)],
            }),
          );
          liveInfo.set(Number(id), info);
        } catch (e) {
          warnings.push(`readContract(getProposalInfoById ${id}) fail: ${errText(e)}`);
        }
      }),
    );
  }

  // ------------------------------------------------ 4) API cross-check / ชื่อผู้สมัคร
  let api: ApiSnapshot | null = p.cachedApi ?? null;
  try {
    if (p.apiRefresh || !api) api = await fetchApiSnapshot(p.apiFallbackUrl);
  } catch (e) {
    warnings.push(`API cross-check fail: ${errText(e)}`);
  }
  const apiById = new Map<number, ApiSnapshot["proposals"][number]>();
  if (api) for (const ap of api.proposals) apiById.set(ap.id, ap);

  // ------------------------------------------------ 5) tally จาก events
  const tally = new Map<string, { amountWei: bigint; users: Set<string>; rows: number }>();
  const perIdVoteRows = new Map<number, number>();
  for (const r of votes) {
    if (!idSet.has(r.proposalId)) continue;
    const k = `${r.proposalId}:${r.choice}`;
    const cur = tally.get(k) ?? { amountWei: 0n, users: new Set<string>(), rows: 0 };
    cur.amountWei += r.amountWei;
    cur.users.add(r.voter);
    cur.rows += 1;
    tally.set(k, cur);
    perIdVoteRows.set(r.proposalId, (perIdVoteRows.get(r.proposalId) ?? 0) + 1);
  }
  function tallyChoiceMax(id: number): number {
    let mx = -1;
    for (const [k] of tally) {
      const [pid, c] = k.split(":");
      if (Number(pid) === id) mx = Math.max(mx, Number(c));
    }
    return mx;
  }

  const uniqueVoters = new Set<string>();
  let totalVoteWei = 0n;
  for (const r of votes) {
    if (!idSet.has(r.proposalId)) continue;
    uniqueVoters.add(r.voter);
    totalVoteWei += r.amountWei;
  }

  // ------------------------------------------------ 6) โหมด
  const mode: ModelMode = onchainOk
    ? "live"
    : api
      ? "api-fallback"
      : "unavailable";
  votes.sort((x, y) => y.block - x.block || y.logIndex - x.logIndex);
  refunds.sort((x, y) => y.block - x.block);

  // ------------------------------------------------ 7) ประกอบโมเดล proposal
  const proposals: ProposalModel[] = DISPLAY_ORDER.map((pid) => {
    const id = Number(pid) as number;
    const live = liveInfo.get(id);
    const created = createdMeta.get(id);
    const ap = apiById.get(id);
    const cat = CATEGORY_BY_ID[id as ProposalId];

    const startTs =
      live?.startTs ??
      (created ? nxo(created.startTime) : undefined) ??
      ap?.startTs ??
      0;
    const endTs =
      live?.endTs ??
      (created ? nxo(created.endTime) : undefined) ??
      ap?.endTs ??
      0;
    const createTime =
      live?.createTime ??
      (created ? nxo(created.createTime) : undefined) ??
      0;

    const numOfChoice: number = firstDefined(
      live ? live.choiceVotedWei.length : undefined,
      created ? nxo(created.numOfChoice) : undefined,
      ap ? ap.options.length : undefined,
    ) ?? Math.max(0, tallyChoiceMax(id) + 1);

    const minQuorumWei = firstDefined(
      live?.minQuorumWei,
      created ? bx(created.minQuorum) : undefined,
    ) ?? (ap ? gkubStringToWei(String(ap.minQuorum)) : 0n);

    const ipfs = live?.ipfs ?? (created ? sx(created.ipfs) : "") ?? "";
    const owner = live?.owner ?? (created ? sx(created.owner) : "") ?? "";

    // คะแนนต่อ choice จาก events
    let optionVotes: bigint[] = [];
    let optionVoters: number[] = [];
    for (let c = 0; c < numOfChoice; c++) {
      const t = tally.get(`${id}:${c}`);
      optionVotes.push(t?.amountWei ?? 0n);
      optionVoters.push(t ? t.users.size : 0);
    }

    // โหมด api-fallback: ไม่มีข้อมูล on-chain → ใช้ API snapshot (แสดง banner แจ้งชัด)
    if (mode === "api-fallback" && ap) {
      optionVotes = ap.options.slice(0, numOfChoice).map((o) => gkubStringToWei(String(o.votes)));
      optionVoters = ap.options.slice(0, numOfChoice).map(() => 0);
    }

    const totalFromLogs = optionVotes.reduce((s, v) => s + v, 0n);
    const totalVotedWei = live?.totalVotedWei ?? totalFromLogs;
    const userVotedLength = firstDefined(
      live?.userVotedLength,
      optionVoters.some((v) => v > 0) ? optionVoters.reduce((s, v) => s + v, 0) : undefined,
    ) ?? 0;
    const quorumMet = minQuorumWei > 0n && totalVotedWei >= minQuorumWei;
    const closed = closedSet.has(id);
    const completed = completedSet.has(id);

    const best = optionVotes.reduce((m, v) => (v > m ? v : m), 0n);
    const bestCount = optionVotes.filter((v) => v === best && v > 0n).length;
    const opts: OptionModel[] = [];
    for (let idx = 0; idx < optionVotes.length; idx++) {
      const apiOpt = ap?.options.find((o) => o.idx === idx);
      const name = apiOpt?.name ?? `ตัวเลือก ${idx + 1}`;
      opts.push({
        idx,
        name,
        isAbstain: apiOpt ? apiOpt.abstain : /^abstain$/i.test(name),
        votesWei: optionVotes[idx] ?? 0n,
        voters: optionVoters[idx] ?? 0,
        pct: totalFromLogs > 0n ? Number((optionVotes[idx]! * 10000n) / totalFromLogs) / 100 : 0,
        isLeader: best !== 0n && bestCount === 1 && optionVotes[idx] === best,
      });
    }

    // cross-check logs vs API (ต่อ option)
    let tallyMatchesApi: boolean | null = null;
    if (mode === "live" && ap) {
      tallyMatchesApi = true;
      for (let idx = 0; idx < opts.length; idx++) {
        const apiOpt = ap.options.find((o) => o.idx === idx);
        const exp = apiOpt ? gkubStringToWei(String(apiOpt.votes)) : 0n;
        if (!compareWeiTol(opts[idx]!.votesWei, exp)) {
          tallyMatchesApi = false;
          break;
        }
      }
    }
    // cross-check logs vs state บนเชน (view choiceVoted)
    let tallyMatchesView: boolean | null = null;
    if (mode === "live" && live) {
      tallyMatchesView = true;
      for (let idx = 0; idx < opts.length; idx++) {
        const chainAmt = live.choiceVotedWei[idx] ?? 0n;
        if (chainAmt !== opts[idx]!.votesWei) {
          tallyMatchesView = false;
          break;
        }
      }
    }

    return {
      id,
      category: cat,
      title: ap?.title ?? cat,
      owner,
      startTs,
      endTs,
      createTime,
      numOfChoice,
      minQuorumWei,
      totalVotedWei,
      userVotedLength,
      ipfs,
      closed,
      completed,
      quorumMet,
      options: opts,
      tallyMatchesApi,
      tallyMatchesView,
      voteRowCount: perIdVoteRows.get(id) ?? 0,
    };
  });

  const crossCheckOk = proposals.some((pp) => pp.tallyMatchesApi !== null)
    ? proposals.every((pp) => pp.tallyMatchesApi !== false)
    : null;

  const voteTokenVerified = voteTokenLive
    ? voteTokenLive.toLowerCase() === GKUB_TOKEN.toLowerCase()
    : false;
  if (voteTokenLive && !voteTokenVerified) {
    warnings.push(`voteToken() = ${voteTokenLive} ≠ config ${GKUB_TOKEN}`);
  }

  const totalVoteCount = [...perIdVoteRows.values()].reduce((s, v) => s + v, 0);

  return {
    model: {
      mode,
      fetchedAtMs: Date.now(),
      latestBlock,
      voteToken: voteTokenLive,
      voteTokenVerified,
      crossCheckOk,
      apiUpdatedAt: api?.updatedAt ?? null,
      apiFetchedAtMs: api?.fetchedAtMs ?? null,
      proposals,
      votes,
      refunds,
      uniqueVoters: uniqueVoters.size,
      totalVoteCount,
      totalVoteWei,
      warnings,
    },
    scannedTo: onchainOk ? latestBlock : p.fromBlock - 1,
  };
}

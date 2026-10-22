/** ตั้งค่าเรียก KUB Chain + normalize proposal info จาก view call */

import { createPublicClient, http } from "viem";
import type { PublicClient, Transport } from "viem";
import { kubChain } from "../config/chain";

export type KubClient = PublicClient<Transport, typeof kubChain>;

export function makeKubClient(rpcUrl: string): KubClient {
  return createPublicClient({
    chain: kubChain,
    transport: http(rpcUrl, { timeout: 12_000 }),
  });
}

/** struct จาก getProposalInfoById — ลำดับ field ยืนยันจาก source จริง (infoBody) */
export const PROPOSAL_INFO_FIELDS = [
  "proposalId",
  "owner",
  "createTime",
  "startTime",
  "endTime",
  "choiceVoted",
  "totalVoted",
  "userVotedLength",
  "minQuorum",
  "minVotePerTime",
  "maxVotePerUser",
  "status",
  "isOnlyNext",
  "ipfs",
] as const;

/** viem คืน tuple ได้ทั้งแบบ array ล้วน หรือ object ชื่อ field — กันไว้ทั้งสองแบบ */
export function pickStruct(obj: unknown, index: number, key: string): unknown {
  if (obj == null) return undefined;
  const asObj = obj as Record<string, unknown>;
  if (key in asObj) return asObj[key];
  if (Array.isArray(obj)) return obj[index];
  return undefined;
}

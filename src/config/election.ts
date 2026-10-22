/**
 * ============================================================
 *  KUB Community Council Election Round 2 — on-chain config
 * ============================================================
 * ทุกค่าด้านล่างยืนยันจากแหล่งจริง ไม่มีการเดา:
 *
 * 1) PROPOSAL_CONTRACT  = GKubProposalV2
 *    - kubscan.com getsourcecode (keyless): ContractName=GKubProposalV2,
 *      Compiler v0.8.17+commit.8df45f5f, Optimization true (20000 runs), IsProxy=false
 *    - owner ของทุก proposal ในเลือกตั้ง Round 2 (สแกน tx จริงจาก kubscan txlist)
 *    - constructor args (จาก kubscan): adminRouter=0x15122c…4eba, kyc=0xf98d63…49d5,
 *      callHelper=0xa755a1…2716, voteToken=0x584871…5dab (gKUB)
 *
 * 2) GKUB_TOKEN = 0x5848718437583e7a086c97836344aa43bfa55dab
 *    - ยืนยัน 3 ชั้น: (a) constructor word4 (b) receipt ของ tx โหวตจริง
 *      0x63202d33… เห็น KAP20 Transfer( user → address(0) ) จาก emitter นี้
 *      (source: voteProposal เรียก voteToken.burn(user, amount)) (c) logic ใน source
 *
 * 3) ช่วงเลือกตั้ง: start 1792558800 (21 ต.ค. 2026 12:00 น. ICT) → end 1794286800
 *    (10 พ.ย. 2026 12:00 น. ICT) — ตรงกับ /api/votes และ tx createProposal จริง
 *
 * 4) SCAN_START_BLOCK = 36255000 (proposal id 15–19 ถูกสร้างที่ block 36255246–36255256)
 *
 * 5) tally จาก getLogs ProposalVoted (24 logs ณ 22 ต.ค. 2026) == /api/votes ตรงเป๊ะทุกรายการ
 * ============================================================
 */

export const PROPOSAL_CONTRACT = "0x5aF70a51ddbb02e717540Dcda351706a1589F5B1" as const;
export const GKUB_TOKEN = "0x5848718437583e7a086c97836344aa43bfa55dab" as const;

export const ROUND_START_TS = 1792558800; // 21 ต.ค. 2026 12:00 น. (ไทย)
export const ROUND_END_TS = 1794286800; // 10 พ.ย. 2026 12:00 น. (ไทย)

export const SCAN_START_BLOCK = 36255000;

export const PROPOSAL_IDS = [15, 16, 17, 18, 19] as const;
export type ProposalId = (typeof PROPOSAL_IDS)[number];

/** หมวดจาก title ของ proposal (ยืนยันกับ /api/votes) — เรียงตามหน้า kubcouncil จริง */
export const CATEGORY_BY_ID: Record<ProposalId, string> = {
  19: "Builder & Developer",
  18: "Community Contributor",
  17: "KOL",
  16: "KUB Coin Holder",
  15: "Node Validator",
};

/** ลำดับการแสดงผล: Builder & Developer → Community Contributor → KOL → KUB Coin Holder → Node Validator */
export const DISPLAY_ORDER: ProposalId[] = [19, 18, 17, 16, 15];

export const APP_CONFIG = {
  VOTE_CHUNK_BLOCKS: 4000, // ขนาด chunk ที่ปลอดภัยกับ rpc.kubchain.io (ทดสอบแล้ว)
  REFRESH_MS: 15000, // อัปเดตอัตโนมัติ ~15 วินาที
  API_TIMEOUT_MS: 8000,
  TX_FEED_LIMIT: 25,
} as const;

/** ABI ย่อที่ใช้จริง — ตัดมาจาก ABI เต็มของ GKubProposalV2 (kubscan getsourcecode)
 *  event/function ทุกตัวรวม struct คงชื่อ field ตามต้นฉบับ */
export const proposalAbi = [
  // ============ events ============
  {
    type: "event",
    name: "ProposalVoted",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: true },
      { name: "choice", type: "uint256", indexed: true },
      { name: "user", type: "address", indexed: true },
      { name: "gKubAmount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ProposalCreated",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "createTime", type: "uint256" },
      { name: "startTime", type: "uint256" },
      { name: "endTime", type: "uint256" },
      { name: "numOfChoice", type: "uint256" },
      { name: "minQuorum", type: "uint256" },
      { name: "minVotePerTime", type: "uint256" },
      { name: "maxVotePerUser", type: "uint256" },
      { name: "isOnlyNext", type: "bool" },
      { name: "ipfs", type: "string" },
    ],
  },
  {
    type: "event",
    name: "ProposalClosed",
    inputs: [{ name: "proposalId", type: "uint256", indexed: true }],
  },
  {
    type: "event",
    name: "ProposalCompleted",
    inputs: [{ name: "proposalId", type: "uint256", indexed: true }],
  },
  {
    type: "event",
    name: "VoteTokenWithdrawn",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: true },
      { name: "user", type: "address", indexed: true },
      { name: "gKubAmount", type: "uint256" },
    ],
  },
  // ============ read functions ============
  {
    type: "function",
    name: "getProposalInfoById",
    stateMutability: "view",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "proposalId", type: "uint256" },
          { name: "owner", type: "address" },
          { name: "createTime", type: "uint256" },
          { name: "startTime", type: "uint256" },
          { name: "endTime", type: "uint256" },
          { name: "choiceVoted", type: "uint256[]" },
          { name: "totalVoted", type: "uint256" },
          { name: "userVotedLength", type: "uint256" },
          { name: "minQuorum", type: "uint256" },
          { name: "minVotePerTime", type: "uint256" },
          { name: "maxVotePerUser", type: "uint256" },
          { name: "status", type: "uint256" },
          { name: "isOnlyNext", type: "bool" },
          { name: "ipfs", type: "string" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getOpenProposalIdAll",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    type: "function",
    name: "getProposalUserVotedByPage",
    stateMutability: "view",
    inputs: [
      { name: "proposalId", type: "uint256" },
      { name: "page", type: "uint256" },
      { name: "limit", type: "uint256" },
    ],
    outputs: [{ name: "", type: "address[]" }],
  },
  {
    type: "function",
    name: "voteToken",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

/** topic0 ที่ยืนยันจาก log จริงบนเชน (24 logs ของช่วงเลือกตั้ง — ตรวจกับ ABI ในแอปด้วย viem อัตโนมัติ) */
export const VERIFIED_TOPIC0 = {
  ProposalVoted: "0xf3801d77e9bff0fe5c3de5dfbdbe6cf3d04bb3e22005abfe7bf389dc78476fd1",
} as const;

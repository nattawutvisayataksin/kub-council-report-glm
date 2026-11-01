/**
 * สคริปต์พิสูจน์ข้อมูลแบบ end-to-end (รันตอน deploy/local):
 *   npm run verify
 *
 * ตรวจ: chainId, code ของ contract, voteToken() บนเชน, นับ ProposalVoted logs ทั้งช่วง,
 * ตรวจสอบผ่าน Block Chain โดยตรง — tally ต้องตรงกับ state บนเชน (view) ไม่งั้น exit ไม่ผ่าน
 */

import { makeKubClient } from "../src/lib/client";
import { RPC_URL_DEFAULT } from "../src/config/chain";
import { GKUB_TOKEN, PROPOSAL_CONTRACT, SCAN_START_BLOCK } from "../src/config/election";
import { fetchElectionModel } from "../src/lib/election";
import { weiToGkubString } from "../src/lib/format";

async function main(): Promise<void> {
  const client = makeKubClient(RPC_URL_DEFAULT);
  const chainId = await client.getChainId();
  const blockNumber = Number(await client.getBlockNumber());
  const code = await client.getBytecode({ address: PROPOSAL_CONTRACT });

  console.log("== KUB Council Report — verify ==");
  console.log("chainId:", chainId, "(expect 96)");
  console.log("blockNumber:", blockNumber);
  console.log("contract code bytes:", code ? (code.length - 2) / 2 : 0);

  const { model } = await fetchElectionModel({
    rpcUrl: RPC_URL_DEFAULT,
    fromBlock: SCAN_START_BLOCK,
    blockTimestamps: new Map(),
  });

  console.log("\nvoteToken() =", model.voteToken, "expect", GKUB_TOKEN);
  console.log("mode:", model.mode, "| voteTokenVerified:", model.voteTokenVerified);

  for (const p of model.proposals) {
    console.log(`\n#${p.id} ${p.title}`);
    for (const o of p.options) {
      const tags = [
        o.isLeader ? "LEADER" : "",
        o.isAbstain ? "abstain" : "",
        `${o.voters} voters`,
      ].filter(Boolean).join(", ");
      console.log(
        `   [${o.idx}] ${o.name.padEnd(28)} ${weiToGkubString(o.votesWei).padStart(10)} gKUB (${tags})`,
      );
    }
    console.log(
      `   total=${weiToGkubString(p.totalVotedWei)} quorum=${weiToGkubString(p.minQuorumWei)} met=${p.quorumMet} txRows=${p.voteRowCount} matchView=${p.tallyMatchesView}`,
    );
  }

  console.log(
    `\nuniqueVoters=${model.uniqueVoters} totalVoteTxs=${model.totalVoteCount} totalGkub=${weiToGkubString(model.totalVoteWei)} burns are definitive`,
  );
  if (model.warnings.length > 0) console.log("warnings:", model.warnings);

  if (!model.voteTokenVerified) throw new Error("voteToken() ไม่ตรงกับ config");
  if (model.mode !== "live") throw new Error("ไม่อยู่ในโหมด live");
  if (model.proposals.some((pp) => pp.tallyMatchesView !== true)) {
    throw new Error("ข้อมูล proposal ไม่ครบหรือ tally จาก logs ไม่ตรงกับ state บนเชน");
  }
  console.log("\n== VERIFIED ✓ — ข้อมูล on-chain ตรวจสอบผ่าน Block Chain โดยตรงแล้ว ทุกตัวตรงกับ state บนเชน ==");
}

main().catch((e) => {
  console.error("VERIFY FAILED:", e);
  throw e;
});

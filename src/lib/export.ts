import { downloadCsv } from "./csv";
import type { ElectionModel } from "./election";
import { buildWalletStats } from "./analytics";
import { weiToGkubString } from "./format";

const stamp = () => new Date().toISOString().slice(0, 10);

/** CSV 1: สรุปผลต่อ (ข้อ, ตัวเลือก) — ค่าทั้งหมดมาจาก on-chain (ยกเว้นโหมด api-fallback ที่ระบุไว้ในคอลัมน์ source) */
export function summaryRows(model: ElectionModel): Array<Record<string, string | number>> {
  const source = model.mode === "live" ? "on-chain" : "api-snapshot";
  const out: Array<Record<string, string | number>> = [];
  for (const p of model.proposals) {
    for (const o of p.options) {
      out.push({
        proposal_id: p.id,
        category: p.category,
        proposal_title: p.title,
        choice_index: o.idx,
        candidate: o.name,
        is_abstain: o.isAbstain ? "yes" : "no",
        votes_gkub: weiToGkubString(o.votesWei),
        vote_share_pct: o.pct.toFixed(2),
        unique_voters_of_choice: o.voters,
        voters_of_proposal: p.userVotedLength,
        total_votes_gkub: weiToGkubString(p.totalVotedWei),
        min_quorum_gkub: weiToGkubString(p.minQuorumWei),
        quorum_met: p.quorumMet ? "yes" : "no",
        status: p.completed ? "completed" : p.closed ? "closed" : "active",
        matches_official_api: model.crossCheckOk == null ? "unknown" : model.crossCheckOk ? "yes" : "no",
        data_source: source,
        captured_at_utc: new Date(model.fetchedAtMs).toISOString(),
      });
    }
  }
  return out;
}

/** CSV 2: ทุกธุรกรรมโหวต (จาก log ProposalVoted) */
export function detailRows(model: ElectionModel): Array<Record<string, string | number>> {
  return model.votes.map((v, i) => {
    const p = model.proposals.find((x) => x.id === v.proposalId);
    const o = p?.options.find((x) => x.idx === v.choice);
    return {
      no: i + 1,
      block: v.block,
      timestamp_bkk: v.blockTs ? new Date(v.blockTs * 1000).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", hour12: false }) : "",
      proposal_id: v.proposalId,
      category: p?.category ?? "",
      choice_index: v.choice,
      candidate: o?.name ?? `choice ${v.choice}`,
      voter_address: v.voter,
      amount_gkub: weiToGkubString(v.amountWei),
      tx_hash: v.txHash,
      tx_url: `https://kubscan.com/tx/${v.txHash}`,
      data_source: model.mode === "live" ? "on-chain ProposalVoted" : "api-snapshot",
    };
  });
}

export function exportSummaryCsv(model: ElectionModel): void {
  downloadCsv(`kub-council-summary-${stamp()}.csv`, summaryRows(model));
}
export function exportDetailCsv(model: ElectionModel): void {
  downloadCsv(`kub-council-votes-${stamp()}.csv`, detailRows(model));
}

/** CSV 3: สรุปต่อผู้โหวต (กระเป๋า) — คะแนนเผา + ยอด gKUB ในกระเป๋า (ถ้าอ่านได้) */
export function walletRows(
  model: ElectionModel,
  balances?: Map<string, bigint>,
): Array<Record<string, string | number>> {
  return buildWalletStats(model).map((w, i) => ({
    rank: i + 1,
    wallet: w.address,
    balance_gkub_now:
      balances?.get(w.address) != null
        ? weiToGkubString(balances.get(w.address)!)
        : "",
    burned_vote_power_gkub: weiToGkubString(w.totalWei),
    vote_tx_count: w.txCount,
    proposals: w.proposalIds.map((x) => `#${x}`).join("|"),
    first_vote_time_bkk: w.firstTs
      ? new Date(w.firstTs * 1000).toLocaleString("th-TH", {
          timeZone: "Asia/Bangkok",
          hour12: false,
        })
      : "",
    last_vote_time_bkk: w.lastTs
      ? new Date(w.lastTs * 1000).toLocaleString("th-TH", {
          timeZone: "Asia/Bangkok",
          hour12: false,
        })
      : "",
    data_source: "on-chain ProposalVoted + balanceOf",
    captured_at_utc: new Date(model.fetchedAtMs).toISOString(),
  }));
}

export function exportWalletCsv(
  model: ElectionModel,
  balances?: Map<string, bigint>,
): void {
  downloadCsv(`kub-council-wallets-${stamp()}.csv`, walletRows(model, balances));
}

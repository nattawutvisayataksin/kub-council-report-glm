import { useMemo, useState } from "react";
import type { ElectionModel } from "../lib/election";
import type { StakeSnapshot, ValidatorStake } from "../lib/staking";
import { explorerAddrUrl } from "../config/chain";
import { fmtNum, shortAddr, weiToGkubString } from "../lib/format";

interface Props {
  model: ElectionModel;
  snapshot: StakeSnapshot | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

function kub(value: bigint): string {
  return fmtNum(weiToGkubString(value));
}

export function StakingPanel({ model, snapshot, loading, error, onRefresh }: Props) {
  const [sort, setSort] = useState<"stake" | "delegated">("stake");
  const voters = useMemo(
    () => new Set(model.votes.map((vote) => vote.voter.toLowerCase())),
    [model.votes],
  );
  const rows = useMemo(() => {
    if (!snapshot) return [];
    return [...snapshot.validators].sort((a, b) => {
      const av = sort === "stake" ? a.stakeWei : a.delegatedWei;
      const bv = sort === "stake" ? b.stakeWei : b.delegatedWei;
      return bv > av ? 1 : bv < av ? -1 : Number(a.validatorId - b.validatorId);
    });
  }, [snapshot, sort]);
  const voterOwned = useMemo(
    () => rows.filter((validator) => voters.has(validator.owner)),
    [rows, voters],
  );
  const totalStake = useMemo(
    () => rows.reduce((sum, validator) => sum + validator.stakeWei, 0n),
    [rows],
  );

  return (
    <section className="card staking-panel">
      <div className="card-head">
        <div>
          <div className="cat">KUB STAKING · PHASE 1</div>
          <h3>Validator NFT และ KUB ที่ stake โดยตรง</h3>
          <p className="mini-note muted">
            ข้อมูลจาก StakeManager ทางการ · NFT 1 ใบแทน ownership ของ validator 1 รายการ
          </p>
        </div>
        <button className="btn" onClick={onRefresh} disabled={loading}>
          {loading ? "กำลังอ่าน validator stake…" : "⟳ โหลด KUB stake"}
        </button>
      </div>

      {!snapshot && !loading && !error && (
        <p className="mini-note muted">
          กดปุ่มเพื่ออ่าน stake ของ validator ทั้งหมดแบบทยอยทีละรายการ เพื่อไม่ชน RPC rate limit
        </p>
      )}
      {error && <p className="mini-note muted">⚠ {error}</p>}

      {snapshot && (
        <>
          <div className="tok-strip stake-summary">
            <span className="wal-chip accent">Active validator NFT: <b>{rows.length}</b></span>
            <span className="wal-chip accent">KUB stake รวม: <b>{kub(totalStake)}</b></span>
            <span className="wal-chip accent">NFT ของผู้โหวต: <b>{voterOwned.length}</b></span>
            <span className="muted">อัปเดต stake snapshot แล้ว · ไม่รวม delegation ของผู้โหวตใน phase นี้</span>
          </div>

          <p className="mini-note muted">
            ยอด gKUB สำหรับการโหวตถูก burn แล้ว และ StakeManager นี้ไม่มี “gKUB unlock schedule” ให้คำนวณได้
            ตารางนี้แสดงเฉพาะ KUB native ที่ owner ของ Validator NFT stake โดยตรง
          </p>

          <div className="txf-scroll" style={{ marginTop: 12 }}>
            <table className="votes">
              <thead>
                <tr>
                  <th>NFT</th>
                  <th>เจ้าของ NFT</th>
                  <th>Signer</th>
                  <th className="sortable" onClick={() => setSort("stake")}>KUB stake {sort === "stake" ? "↓" : "↕"}</th>
                  <th className="sortable" onClick={() => setSort("delegated")}>Delegated KUB {sort === "delegated" ? "↓" : "↕"}</th>
                  <th>ผู้โหวต?</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((validator: ValidatorStake) => (
                  <tr key={validator.validatorId.toString()}>
                    <td>#{validator.validatorId.toString()}</td>
                    <td><a className="mono" href={explorerAddrUrl(validator.owner)} target="_blank" rel="noreferrer">{shortAddr(validator.owner)}</a></td>
                    <td><a className="mono" href={explorerAddrUrl(validator.signer)} target="_blank" rel="noreferrer">{shortAddr(validator.signer)}</a></td>
                    <td style={{ textAlign: "right" }}>{kub(validator.stakeWei)}</td>
                    <td style={{ textAlign: "right" }}>{kub(validator.delegatedWei)}</td>
                    <td>{voters.has(validator.owner) ? <span className="pill ok">ใช่ · burn gKUB</span> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

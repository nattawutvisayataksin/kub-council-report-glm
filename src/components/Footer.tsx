import { EXPLORER_URL, explorerAddrUrl, explorerTxUrl } from "../config/chain";
import { GKUB_TOKEN, PROPOSAL_CONTRACT, VERIFIED_TOPIC0 } from "../config/election";
import type { ElectionModel } from "../lib/election";

export function Footer({ model }: { model: ElectionModel }) {
  return (
    <footer>
      <div>
        แหล่งข้อมูลหลักที่ใช้:
        <a href={`${EXPLORER_URL}/address/${PROPOSAL_CONTRACT}`} target="_blank" rel="noreferrer">
          GKubProposalV2 (contract)
        </a>
        ·
        <a href={explorerAddrUrl(GKUB_TOKEN)} target="_blank" rel="noreferrer">
          gKUB vote token
        </a>
        · RPC <code className="mono">https://rpc.kubchain.io</code> · cross-check
        <a href="https://kubcouncil.vercel.app/api/votes" target="_blank" rel="noreferrer">
          kubcouncil /api/votes
        </a>
      </div>
      <div>
        การยืนยันล่าสุด: contract = GKubProposalV2 (source-code ยืนยันบน kubscan, ไม่ใช่ proxy) · gKUB = 0x5848…5dab
        (constructor args + receipt Transfer เข้า address(0) จาก log การโหวตจริง) ·
        event คะแนน <code className="mono">ProposalVoted</code> topic0 {VERIFIED_TOPIC0.ProposalVoted.slice(0, 14)}… —
        tally ต่อ (ข้อ, ตัวเลือก) ตรงกับ /api/votes ทุกรายการ ณ {" "}
        {model.apiUpdatedAt ?? "—"}
      </div>
      <div>
        <ul>
          <li>โหวตถูก "เผา" ผ่าน <code className="mono">gKUB.burn(user, amount)</code> — คะแนน additive จริง (withdraw ซอร์สยืนยันว่าไม่ลด choiceVoted)</li>
          <li>คะแนนแสดงเป็น gKUB ที่มี decimals = 18 (ยืนยันโดยตรงกับ minQuorum 20 gKUB และตัวเลข API ตรงเป๊ะ)</li>
          <li>ชื่อผู้สมัครมาจาก /api/votes โดยตรวจสอบว่า index ของ choice บนเชน = index ของ options ใน API (numOfChoice + ตัวเลข per option เทียบแล้ว)</li>
          <li>read-only ทั้งหมด — ไม่ผูก wallet ไม่มีการกระทำการใด ๆ บนเชน</li>
        </ul>
      </div>
      <div>
        โปรเจกต์สาธารณะ - ไม่ใช่เว็บทางการของ KUB/KUB Chain · สร้างด้วย React + viem · ข้อมูลทั้งหมดมาจาก
        KUB Chain Mainnet พร้อม cross-check ทุกรอบ ·
        ตัวอย่าง tx เปิดดูได้ที่ <a href={explorerTxUrl(model.votes[0]?.txHash ?? "")} target="_blank" rel="noreferrer">รายการโหวตล่าสุด</a>
      </div>
    </footer>
  );
}

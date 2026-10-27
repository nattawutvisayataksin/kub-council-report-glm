import {
  STAKE_MANAGER_STORAGE,
  STAKE_STORAGE_ABI,
  STAKING_NFT,
  STAKING_NFT_ABI,
} from "../config/staking";
import type { KubClient } from "./client";
import { sleep } from "./token";

export interface ValidatorStake {
  validatorId: bigint;
  owner: string;
  signer: string;
  stakeWei: bigint;
  delegatedWei: bigint;
  status: number;
}

export interface StakeSnapshot {
  validators: ValidatorStake[];
  fetchedAtMs: number;
}

/** Keep requests serialized because the public KUB RPC rate-limits burst reads. */
const STAKE_READ_DELAY_MS = 420;

export async function fetchValidatorStakeSnapshot(client: KubClient): Promise<StakeSnapshot> {
  const length = await client.readContract({
    address: STAKE_MANAGER_STORAGE,
    abi: STAKE_STORAGE_ABI,
    functionName: "getValidatorListLength",
  });
  const validators: ValidatorStake[] = [];

  for (let index = 0n; index < length; index++) {
    try {
      const info = await client.readContract({
        address: STAKE_MANAGER_STORAGE,
        abi: STAKE_STORAGE_ABI,
        functionName: "getValidatorInfoByIndex",
        args: [index],
      });
      await sleep(STAKE_READ_DELAY_MS);
      const owner = await client.readContract({
        address: STAKING_NFT,
        abi: STAKING_NFT_ABI,
        functionName: "ownerOf",
        args: [index],
      });

      // Status 1 is Active in the verified StakeManagerV2 source.
      if (info.status === 1 && info.amount > 0n) {
        validators.push({
          validatorId: index,
          owner: owner.toLowerCase(),
          signer: info.signer.toLowerCase(),
          stakeWei: info.amount,
          delegatedWei: info.delegatedAmount,
          status: info.status,
        });
      }
    } catch {
      // Unstaked NFT ids are burned and ownerOf reverts; omit them from active stake data.
    }
    if (index + 1n < length) await sleep(STAKE_READ_DELAY_MS);
  }

  return { validators, fetchedAtMs: Date.now() };
}

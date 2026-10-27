/** KUB Mainnet PoS contracts — addresses verified from KUB Docs and Kubscan source. */
export const STAKE_MANAGER = "0x443502b3F7C0934576F49CDa084f78640f56A80F" as const;
export const STAKE_MANAGER_STORAGE = "0xFd98aac1Fbc57e6BC16A167452DBA7af2B6a4c0d" as const;
export const STAKING_NFT = "0x8ae4Cb6a020121bCbD855fffc79A11984bE62B39" as const;

export const STAKE_STORAGE_ABI = [
  {
    type: "function",
    name: "getValidatorListLength",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "getValidatorInfoByIndex",
    stateMutability: "view",
    inputs: [{ name: "index_", type: "uint256" }],
    outputs: [{
      type: "tuple",
      components: [
        { name: "amount", type: "uint128" },
        { name: "delegatedAmount", type: "uint128" },
        { name: "reward", type: "uint128" },
        { name: "delegatorsReward", type: "uint128" },
        { name: "infraCommissionAmount", type: "uint128" },
        { name: "validatorCommissionAmount", type: "uint128" },
        { name: "delegatorCommissionAmount", type: "uint128" },
        { name: "minDeposit", type: "uint128" },
        { name: "signer", type: "address" },
        { name: "validatorShareContract", type: "address" },
        { name: "status", type: "uint8" },
        { name: "infraCommissionRate", type: "uint16" },
        { name: "commissionRate", type: "uint16" },
      ],
    }],
  },
] as const;

export const STAKING_NFT_ABI = [
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "address" }],
  },
] as const;

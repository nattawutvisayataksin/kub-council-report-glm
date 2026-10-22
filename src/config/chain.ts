import { defineChain } from "viem";

/** KUB Chain Mainnet — ยืนยันจาก RPC จริง: eth_chainId = 0x60 (96) */
export const kubChain = defineChain({
  id: 96,
  name: "KUB Chain",
  network: "kubchain",
  nativeCurrency: { name: "KUB", symbol: "KUB", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.kubchain.io"] } },
  blockExplorers: { default: { name: "KUBSCAN", url: "https://kubscan.com" } },
});

export const RPC_URL_DEFAULT = "https://rpc.kubchain.io";
export const API_FALLBACK_DEFAULT = "https://kubcouncil.vercel.app/api/votes";

export function getRpcUrl(): string {
  return import.meta.env.VITE_RPC_URL || RPC_URL_DEFAULT;
}
export function getApiFallbackUrl(): string {
  return import.meta.env.VITE_API_FALLBACK_URL || API_FALLBACK_DEFAULT;
}

export const EXPLORER_URL = kubChain.blockExplorers.default.url;
export function explorerTxUrl(txHash: string): string {
  return `${EXPLORER_URL}/tx/${txHash}`;
}
export function explorerAddrUrl(address: string): string {
  return `${EXPLORER_URL}/address/${address}`;
}

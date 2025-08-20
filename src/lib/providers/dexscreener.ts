// Minimaler Wrapper für DEXScreener (public)
export type DexPair = {
  chainId: string;
  pairAddress: string;
  url?: string;
  baseToken: { address: string; symbol?: string; name?: string };
  quoteToken: { address: string; symbol?: string; name?: string };
  priceUsd?: string;
  liquidity?: { usd?: number };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number; // ms
};

const BASE = "https://api.dexscreener.com";

// Holt alle Pairs für einen Token auf einer Chain (z. B. solana)
export async function getPairsByToken(
  chain: string,
  tokenAddress: string
): Promise<DexPair[]> {
  const res = await fetch(`${BASE}/token-pairs/v1/${chain}/${tokenAddress}`, {
    // kein caching, wir wollen frische Daten beim Debug
    cache: "no-store",
    // bei Next 15: notfalls revalidate auf 0
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`DEXScreener ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as DexPair[];
}

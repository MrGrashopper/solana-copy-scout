export type DexPair = {
  chainId: string;
  pairAddress: string;
  base: { address: string; symbol: string; name: string };
  quote: { address: string; symbol: string; name: string };
  liquidityUsd?: number;
  liquidity?: { usd?: number };
  fdv?: number;
  pairCreatedAt?: number; // ms epoch
};

// Holt die besten Pairs zu einem Mint (Solana)
export async function getPairsForMint(mint: string): Promise<DexPair[]> {
  const url = `https://api.dexscreener.com/latest/dex/tokens/${mint}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const json = await res.json();
  return (json?.pairs ?? []).filter((p: any) => p.chainId === "solana");
}

// Nimmt das "beste" Pair (höchste liquidityUsd) als Repräsentant
export async function getBestPairMeta(mint: string) {
  const pairs = await getPairsForMint(mint);
  if (!pairs.length) return null;
  const best = pairs
    .map((p) => ({
      mint,
      liquidityUsd: Number(p.liquidity?.usd ?? p.liquidityUsd ?? 0),
      fdv: Number(p.fdv ?? 0),
      pairCreatedAt: p.pairCreatedAt ? Number(p.pairCreatedAt) : undefined,
    }))
    .sort((a, b) => (b.liquidityUsd || 0) - (a.liquidityUsd || 0))[0];
  return best;
}

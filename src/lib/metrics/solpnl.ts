import { fetchAddressTxs, EnhancedTx } from "@/lib/providers/helius";
const LAMPORTS_PER_SOL = 1_000_000_000;

export type MintStats = Record<string, { swaps: number; firstTs: number }>;

export async function computeSolPnl(params: {
  address: string;
  days: number;
  apiKey: string;
  maxTx?: number;
}) {
  const { address, days, apiKey, maxTx = 1000 } = params;

  const end = Math.floor(Date.now() / 1000);
  const start = end - days * 24 * 3600;

  const txs: EnhancedTx[] = await fetchAddressTxs(
    address,
    start,
    end,
    apiKey,
    maxTx
  );

  let solInLamports = 0;
  let solOutLamports = 0;
  let feesLamports = 0;

  const mintStats: MintStats = {};

  for (const tx of txs) {
    for (const nt of tx.nativeTransfers ?? []) {
      const amt = nt.amount ?? 0;
      if (!amt) continue;
      if (nt.toUserAccount === address) solInLamports += amt;
      if (nt.fromUserAccount === address) solOutLamports += amt;
    }
    if (tx.fee && tx.feePayer === address) feesLamports += tx.fee;

    const swaps = tx.events?.swap ?? [];
    for (const s of swaps) {
      for (const t of s.tokenTransfers ?? []) {
        const mint = t.mint;
        if (!mint) continue;
        const prev = mintStats[mint];
        if (!prev) mintStats[mint] = { swaps: 1, firstTs: tx.timestamp };
        else {
          prev.swaps += 1;
          if (tx.timestamp < prev.firstTs) prev.firstTs = tx.timestamp;
        }
      }
    }
  }

  const netLamports = solInLamports - solOutLamports - feesLamports;
  const netSol = netLamports / LAMPORTS_PER_SOL;

  const uniqueTokens = Object.keys(mintStats).length;
  const totalTokenTouches = Object.values(mintStats).reduce(
    (a, b) => a + b.swaps,
    0
  );
  const topTokenShare = totalTokenTouches
    ? Math.max(...Object.values(mintStats).map((x) => x.swaps)) /
      totalTokenTouches
    : 0;

  return {
    windowDays: days,
    txCount: txs.length,
    solIn: solInLamports / LAMPORTS_PER_SOL,
    solOut: solOutLamports / LAMPORTS_PER_SOL,
    fees: feesLamports / LAMPORTS_PER_SOL,
    netSol,
    // wichtig fürs Risiko:
    mintStats,
    uniqueTokens,
    topTokenShare,
  };
}

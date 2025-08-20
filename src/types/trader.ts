export type TraderRow = {
  address: string;
  pnlUsd: number;
  roi: number; // 0..1 (z. B. 0.27 = 27%)
  winrate: number; // 0..1
  profitFactor: number;
  sharpe: number;
  trades: number;
  uniqueTokens: number;
  medianHoldH: number;
  lowCapShare: number; // 0..1
  score: number; // 0..100
  flags?: string[];
};

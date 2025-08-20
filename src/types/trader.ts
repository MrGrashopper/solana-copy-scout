export type TraderRow = {
  address: string;
  pnlUsd: number;
  roi: number;
  winrate: number;
  profitFactor: number;
  sharpe: number;
  trades: number;
  uniqueTokens: number;
  medianHoldH: number;
  lowCapShare: number;
  score: number;
  flags?: string[];
  pnlSol?: number;
};

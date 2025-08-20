import { NextResponse } from "next/server";
import type { TraderRow } from "@/types/trader";

export async function POST(req: Request) {
  // Body wird später für Filter genutzt – fürs MVP-Stub ignorieren
  const now = Date.now();

  const fake: TraderRow[] = [
    {
      address: "8xNAp8u4S7QvMxHBJ2y3rxR9Uvt2tS4oP2d2FzXxAAAA",
      pnlUsd: 12450,
      roi: 0.38,
      winrate: 0.62,
      profitFactor: 2.4,
      sharpe: 1.9,
      trades: 57,
      uniqueTokens: 6,
      medianHoldH: 18,
      lowCapShare: 0.08,
      score: 86,
      flags: [],
    },
    {
      address: "7y4QzW2Q1uE8bKd91sEaA7oZ8r3HkLk2vCwVvBBBBBB",
      pnlUsd: 8450,
      roi: 0.27,
      winrate: 0.59,
      profitFactor: 1.9,
      sharpe: 1.4,
      trades: 44,
      uniqueTokens: 5,
      medianHoldH: 26,
      lowCapShare: 0.12,
      score: 74,
    },
    {
      address: "9kLM2h2tPqQaA1bb3wXxZzRr9cCcGgHhJjKkCCCCCCC",
      pnlUsd: 3150,
      roi: 0.11,
      winrate: 0.54,
      profitFactor: 1.3,
      sharpe: 0.9,
      trades: 35,
      uniqueTokens: 4,
      medianHoldH: 12,
      lowCapShare: 0.05,
      score: 61,
    },
    {
      address: "5TtRrEeWwQqAaZzXxCcVvBbNnMm123456DDDDDDDDD",
      pnlUsd: -950,
      roi: -0.03,
      winrate: 0.48,
      profitFactor: 0.9,
      sharpe: 0.2,
      trades: 28,
      uniqueTokens: 3,
      medianHoldH: 9,
      lowCapShare: 0.18,
      score: 41,
      flags: ["Drawdown"],
    },
    {
      address: "3Xz39WkutAXnKsZ7zimgWJK9fGJPAhghtsZMjePTzeLQ",
      pnlUsd: 2100,
      roi: 0.07,
      winrate: 0.52,
      profitFactor: 1.2,
      sharpe: 0.6,
      trades: 31,
      uniqueTokens: 4,
      medianHoldH: 15,
      lowCapShare: 0.09,
      score: 55,
    },
  ];

  // später: persistieren + runId
  return NextResponse.json({
    runId: String(now),
    items: fake.sort((a, b) => b.score - a.score),
  });
}

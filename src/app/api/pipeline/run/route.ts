import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GET as discover } from "../../discover/route";
import { computeSolPnl } from "@/lib/metrics/solpnl";
import { getBestPairMeta } from "@/lib/providers/dexscreener";

export async function POST() {
  // 1) Adressen holen
  const res = await discover();
  const { discovered }: { discovered: string[] } = await res.json();

  if (!discovered?.length) {
    // nichts zu tun, aber wir legen dennoch einen Run an, damit UI konsistent bleibt
    const emptyRun = await prisma.discoveryRun.create({
      data: { windowDays: 7 },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, runId: emptyRun.id, items: [] });
  }

  const apiKey = process.env.HELIUS_API_KEY!;
  const windowDays = 7; // MVP: fest

  // 2) Run erzeugen
  const run = await prisma.discoveryRun.create({
    data: { windowDays },
    select: { id: true },
  });

  // 3) Für jede Adresse echte Kennzahlen laden (parallel, aber begrenzt)
  const limit = 3; // MVP: Max 3 gleichzeitige Requests
  const queue: Promise<void>[] = [];
  const rows: any[] = [];
  const now = new Date();

  for (const address of discovered) {
    const job = (async () => {
      try {
        const r = await computeSolPnl({ address, days: windowDays, apiKey });

        // helpers
        const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
        const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

        const eps = 1e-9;
        const roiSol = r.netSol / Math.max(r.solOut, eps); // Rendite auf eingesetztes SOL
        const roiNorm = sigmoid(roiSol / 0.5);
        const netSolBoost = Math.tanh(r.netSol * 5);
        const netNorm = (netSolBoost + 1) / 2;
        const actNorm = clamp01(r.txCount / 40);

        // Diversität & Konzentration
        const divNorm = clamp01((r.uniqueTokens - 3) / 7); // 3..10 Tokens → 0..1
        const concPenalty =
          r.topTokenShare > 0.6 ? (r.topTokenShare - 0.6) * 60 : 0; // >60% auf einem Token → Malus
        const lossPenalty = r.netSol < 0 ? 0.15 : 0;

        // Initialer Score
        let score =
          45 * roiNorm +
          30 * netNorm +
          15 * divNorm +
          10 * actNorm -
          100 * lossPenalty -
          concPenalty;

        score = Math.max(0, Math.min(100, Math.round(score)));

        // ---- Risiko: Low-Cap & Early-Entry (Dev-/Pump-Heuristik) ----
        const minLiq = 100_000; // USD
        const minFdv = 10_000_000; // USD
        const minAgeDays = 7; // Tage
        const earlyWindowSec = 60 * 60; // 60 Min nach Pair-Erstellung gilt als "sehr früh"

        const mintsSorted = Object.entries(r.mintStats ?? {})
          .sort((a, b) => b[1].swaps - a[1].swaps)
          .slice(0, 5); // nur Top-5 Mints abfragen (Rate-Limit-schonend)

        let riskyCount = 0;
        let earlyCount = 0;
        let checked = 0;

        for (const [mint, ms] of mintsSorted) {
          const meta = await getBestPairMeta(mint);
          if (!meta) continue;
          checked++;

          const ageDays = meta.pairCreatedAt
            ? Math.max(
                0,
                (Date.now() - meta.pairCreatedAt) / (1000 * 3600 * 24)
              )
            : Infinity;

          const isLowCap =
            (meta.liquidityUsd ?? 0) < minLiq ||
            (meta.fdv ?? 0) < minFdv ||
            ageDays < minAgeDays;
          if (isLowCap) riskyCount++;

          const isEarly = meta.pairCreatedAt
            ? ms.firstTs * 1000 - meta.pairCreatedAt <= earlyWindowSec * 1000
            : false;
          if (isEarly) earlyCount++;
        }

        const lowCapShare = checked ? riskyCount / checked : 0;
        const earlyShare = checked ? earlyCount / checked : 0;

        // Penalties (fein justierbar)
        const lowCapPenalty = Math.round(lowCapShare * 20); // bis -20 Punkte
        const earlyPenalty = Math.round(earlyShare * 30); // bis -30 Punkte
        score = Math.max(
          0,
          Math.min(100, score - lowCapPenalty - earlyPenalty)
        );

        const flagsArr: string[] = [];
        if (lowCapShare > 0)
          flagsArr.push(`LOWCAP_${Math.round(lowCapShare * 100)}%`);
        if (earlyShare > 0)
          flagsArr.push(`EARLY_${Math.round(earlyShare * 100)}%`);

        rows.push({
          runId: run.id,
          address,
          pnlUsd: 0,
          roi: roiSol, // ROI in SOL-Bezug (kannst du später in separates Feld legen)
          winrate: 0,
          profitFactor: 0,
          sharpe: 0,
          trades: r.txCount,
          uniqueTokens: r.uniqueTokens,
          medianHoldH: 0,
          lowCapShare,
          score,
          flags: flagsArr.length ? flagsArr.join(",") : null, // <-- wichtig
          createdAt: now,
          pnlSol: r.netSol,
        });
      } catch {
        rows.push({
          runId: run.id,
          address,
          pnlUsd: 0,
          roi: 0,
          winrate: 0,
          profitFactor: 0,
          sharpe: 0,
          trades: 0,
          uniqueTokens: 0,
          medianHoldH: 0,
          lowCapShare: 0,
          score: 0,
          flags: "ERR_HELIUS",
          createdAt: now,
          pnlSol: 0,
        });
      }
    })();

    queue.push(job);

    if (queue.length >= limit) {
      await Promise.race(queue);
      // simple Drosselung: Queue beschneiden
      queue.splice(0, queue.length - limit + 1);
    }
  }
  await Promise.all(queue);

  // 4) Persistieren & zurückgeben
  await prisma.traderSnapshot.createMany({ data: rows });
  rows.sort((a, b) => b.score - a.score);

  return NextResponse.json({ ok: true, runId: run.id, items: rows });
}

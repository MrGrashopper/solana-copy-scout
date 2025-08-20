import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GET as discover } from "../../discover/route"; // direkter Import

// --- kleiner Fake-Scorer wie zuvor ---
function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function fakeMetrics(address: string) {
  const h = hashStr(address);
  const rr = (min: number, max: number) =>
    min + ((h % 1000) / 1000) * (max - min);
  const roi = rr(-0.05, 0.45);
  const winrate = rr(0.45, 0.7);
  const profitFactor = rr(0.8, 2.8);
  const sharpe = rr(0.1, 2.2);
  const trades = Math.round(rr(15, 70));
  const uniqueTokens = Math.round(rr(3, 8));
  const medianHoldH = Math.round(rr(6, 36));
  const lowCapShare = rr(0.02, 0.25);
  const pnlUsd = Math.round(rr(-1500, 14000));
  const score = Math.round(
    25 * (1 / (1 + Math.exp(-(roi / 0.5)))) +
      20 * winrate +
      15 * Math.max(0, Math.min(1, (profitFactor - 1) / 2)) +
      10 * Math.max(0, Math.min(1, sharpe / 3)) +
      10 * Math.max(0, Math.min(1, (uniqueTokens - 3) / 7)) +
      10 * Math.max(0, Math.min(1, trades / 50)) -
      10 * Math.max(0, Math.min(1, lowCapShare))
  );
  return {
    roi,
    winrate,
    profitFactor,
    sharpe,
    trades,
    uniqueTokens,
    medianHoldH,
    lowCapShare,
    pnlUsd,
    score,
  };
}

export async function POST() {
  // 1) Adressen aus der Discovery holen
  const res = await discover();
  const { discovered }: { discovered: string[] } = await res.json();

  // 2) Run erzeugen (Defaults aus dem Schema genügen)
  const run = await prisma.discoveryRun.create({
    data: {},
    select: { id: true },
  });

  // 3) Snapshots vorbereiten
  const now = new Date();
  const rows = (discovered ?? []).map((address: string) => {
    const m = fakeMetrics(address);
    return {
      runId: run.id,
      address,
      pnlUsd: m.pnlUsd,
      roi: m.roi,
      winrate: m.winrate,
      profitFactor: m.profitFactor,
      sharpe: m.sharpe,
      trades: m.trades,
      uniqueTokens: m.uniqueTokens,
      medianHoldH: m.medianHoldH,
      lowCapShare: m.lowCapShare,
      score: m.score,
      flags: null as string | null,
      createdAt: now,
    };
  });

  // 4) Persistieren
  await prisma.traderSnapshot.createMany({ data: rows });

  // 5) Sortiert zurückgeben
  rows.sort((a, b) => b.score - a.score);
  return NextResponse.json({ ok: true, runId: run.id, items: rows });
}

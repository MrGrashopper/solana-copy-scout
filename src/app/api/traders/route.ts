import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  // Body erlaubt nur address + (optional) score; Rest füllen wir minimal
  const { address, score = 50 } = await req.json();

  if (typeof address !== "string" || address.length < 32) {
    return NextResponse.json(
      { ok: false, error: "address (string) fehlt/ungültig" },
      { status: 400 }
    );
  }

  // 1) DiscoveryRun anlegen (Relation ist required)
  const run = await prisma.discoveryRun.create({
    data: {}, // Defaults aus dem Schema greifen (windowDays, minLiq, ...)
    select: { id: true },
  });

  // 2) TraderSnapshot mit KORREKTEN FELDNAMEN anlegen
  const snapshot = await prisma.traderSnapshot.create({
    data: {
      runId: run.id,
      address, // <- richtiges Feld
      pnlUsd: 0,
      roi: 0,
      winrate: 0,
      profitFactor: 0,
      sharpe: 0,
      trades: 0,
      uniqueTokens: 0,
      medianHoldH: 0,
      lowCapShare: 0,
      score, // z. B. 50
      flags: null, // optional
    },
  });

  return NextResponse.json({ ok: true, runId: run.id, snapshot });
}

export async function GET() {
  const items = await prisma.traderSnapshot.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return NextResponse.json({ ok: true, items });
}

// src/app/api/pipeline/run/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// Optional: vermeidet 405-Noise, erinnert an POST
export async function GET() {
  return NextResponse.json({ ok: false, hint: "Use POST to start a run." });
}

export async function POST(req: Request) {
  try {
    const { origin, searchParams } = new URL(req.url);

    // Programme bestimmen: Query > ENV > Fallback (korrekte Jupiter-ID)
    const qp = searchParams.get("programs")?.trim() ?? "";
    const envPrograms = (process.env.DEX_PROGRAMS ?? "").trim();
    const programs =
      qp || envPrograms || "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4";

    const days = searchParams.get("days") ?? "2";
    const perProgram = searchParams.get("perProgram") ?? "200";
    const minSwaps = searchParams.get("minSwaps") ?? "1";
    const maxWallets = searchParams.get("maxWallets") ?? "40";

    const qs = new URLSearchParams({
      days,
      perProgram,
      minSwaps,
      maxWallets,
      programs,
    }).toString();

    // 1) Discovery triggern
    const discRes = await fetch(`${origin}/api/discover?${qs}`, {
      cache: "no-store",
    });
    if (!discRes.ok) {
      return NextResponse.json(
        { ok: false, error: "discover failed" },
        { status: 500 }
      );
    }
    const { discovered, meta }: { discovered: string[]; meta: any } =
      await discRes.json();

    // 2) Run anlegen (DiscoveryRun!)
    const run = await prisma.discoveryRun.create({
      data: { windowDays: parseInt(days, 10) || 7 },
      select: { id: true, createdAt: true, windowDays: true },
    });

    // Wenn nix gefunden: leer zurück
    if (!discovered?.length) {
      return NextResponse.json({
        ok: true,
        runId: run.id,
        createdAt: run.createdAt,
        windowDays: run.windowDays,
        itemsCount: 0,
        savedCount: 0,
        dbCount: 0,
        meta,
      });
    }

    // 3) Snapshots vorbereiten – ALLE Pflichtfelder setzen
    const now = new Date();
    const rows: Prisma.TraderSnapshotCreateManyInput[] = discovered.map(
      (addr) => ({
        runId: run.id,
        address: addr,
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
        flags: null, // optional
        createdAt: now, // Pflichtfeld in deinem Schema
        // pnlSol ist optional mit Default(0) – kannst du setzen oder weglassen
        pnlSol: 0,
      })
    );

    // 4) Speichern (bei SQLite KEIN skipDuplicates nutzen)
    const result = await prisma.traderSnapshot.createMany({ data: rows });
    const savedCount = result.count;

    // 5) Gegencheck aus DB
    const dbCount = await prisma.traderSnapshot.count({
      where: { runId: run.id },
    });

    return NextResponse.json({
      ok: true,
      runId: run.id,
      createdAt: run.createdAt,
      windowDays: run.windowDays,
      itemsCount: rows.length,
      savedCount,
      dbCount,
      meta,
    });
  } catch (err: any) {
    console.error("Pipeline error", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "pipeline error" },
      { status: 500 }
    );
  }
}

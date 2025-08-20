import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: { runId: string } }
) {
  const run = await prisma.discoveryRun.findUnique({
    where: { id: params.runId },
    include: {
      snapshots: {
        orderBy: { score: "desc" },
        select: {
          id: true,
          address: true,
          score: true,
          pnlSol: true,
          trades: true,
          uniqueTokens: true,
          flags: true,
          createdAt: true,
        },
      },
    },
  });

  if (!run) {
    return NextResponse.json(
      { ok: false, error: "Run not found" },
      { status: 404 }
    );
  }

  const items = run.snapshots.map((s) => ({
    id: s.id,
    address: s.address,
    score: s.score,
    pnlSol: s.pnlSol ?? 0,
    trades: s.trades,
    uniqueTokens: s.uniqueTokens,
    flags: s.flags ?? "",
    createdAt: s.createdAt,
  }));

  return NextResponse.json({
    ok: true,
    runId: run.id,
    createdAt: run.createdAt,
    windowDays: run.windowDays,
    count: items.length,
    items,
  });
}

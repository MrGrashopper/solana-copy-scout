import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const runs = await prisma.discoveryRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      createdAt: true,
      _count: { select: { snapshots: true } },
    },
  });
  return NextResponse.json({
    ok: true,
    items: runs.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      snapshotCount: r._count.snapshots,
    })),
  });
}

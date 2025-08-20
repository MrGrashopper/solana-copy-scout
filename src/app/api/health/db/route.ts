// src/app/api/health/db/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const runs = await prisma.discoveryRun.count();
    const snaps = await prisma.traderSnapshot.count();
    return NextResponse.json({
      ok: true,
      db: "sqlite",
      runs,
      snapshots: snaps,
      ts: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // einfacher Ping
    await prisma.$queryRaw`SELECT 1`;

    // optional: kleine Statistik
    const runs = await prisma.discoveryRun.count();

    return NextResponse.json({
      ok: true,
      db: "sqlite",
      runs,
      ts: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}

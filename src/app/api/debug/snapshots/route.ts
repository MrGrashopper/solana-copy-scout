import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const snaps = await prisma.traderSnapshot.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json(snaps);
}
